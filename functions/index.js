
const {S3Client, GetObjectCommand, PutObjectCommand} = require("@aws-sdk/client-s3");
const Sharp = require("sharp");

const constant =require("./constant");
require('dotenv').config();


const s3Client = new S3Client({
    region: process.env.AWS_LAMBDA_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const S3_ORIGINAL_IMAGE_BUCKET = process.env.originalImageBucketName;
const S3_TRANSFORMED_IMAGE_BUCKET = process.env.transformedImageBucketName;
const TRANSFORMED_IMAGE_CACHE_TTL = process.env.transformedImageCacheTTL;
// const MAX_IMAGE_SIZE = parseInt(process.env.maxImageSize);

const downloadImageFromOriginalBucket = async (originalImagePath) => {
   // Downloading original image
    try {
        const getOriginalImageCommand = new GetObjectCommand({ Bucket: S3_ORIGINAL_IMAGE_BUCKET, Key: originalImagePath });
        const getOriginalImageCommandOutput = await s3Client.send(getOriginalImageCommand);
        console.log(`Got response from S3 for ${originalImagePath}`);

        const originalImageBody = await getOriginalImageCommandOutput.Body.transformToByteArray();
        const contentType = getOriginalImageCommandOutput.ContentType;
        return { originalImageBody, contentType};
    } catch (error) {
        console.log('Error downloading original image', error);
    }
}



const resize = async (transformedImage, info, resolution, imageName, resolutionName, imagePathArray) => {
    try {
        const [imageNameWithoutExt, imageExt] = imageName.split('.');

        let imageHeight = null;
        let imageWidth = null;

        if (info.height >= info.width && info.height > resolution.size) {
            imageWidth = resolution.size;
        }
        if (info.width > resolution.size) {
            imageHeight = resolution.size;
        }
        
        const resizeSharpObj = transformedImage.resize({
                                width: imageWidth,
                                height: imageHeight,
                            });
        
        let contentType;
        
        switch(imageExt) {
            case 'jpg': contentType = 'image/jpeg'; break;
            case 'jpeg': contentType = 'image/jpeg'; break;
            case 'png': contentType = 'image/png'; break;
            case 'gif': contentType = 'image/gif'; break;
            case 'webp': contentType = 'image/webp'; break;
            default: contentType = 'image/webp'; break;
        }
        const resizeImage = resizeSharpObj.toFormat(imageExt, {
            quality: 80,
        })
        const resizedImageBuffer = await resizeImage.toBuffer();
        
        // upload to aws
        const destImagePathArray = [...imagePathArray];
        let destinationFilePath = `${imageNameWithoutExt}-${resolutionName.toLowerCase()}.${imageExt}`;
        
        if(destImagePathArray.length >= 1){
            // if folder name exists
            destImagePathArray.push(destinationFilePath);
        }

        destinationFilePath = destImagePathArray.length >= 1 ? destImagePathArray.join('/'): destinationFilePath;
        
        const putImageCommand = new PutObjectCommand({
            Body: resizedImageBuffer,
            Bucket: S3_TRANSFORMED_IMAGE_BUCKET,
            Key: destinationFilePath,
            ContentType: contentType,
            Metadata: {
                'cache-control': TRANSFORMED_IMAGE_CACHE_TTL,
            },
        })
        await s3Client.send(putImageCommand);

        console.log("Image uploaded successfully!", destinationFilePath);
    }
    catch (error) {
        console.log('Could not upload transformed image to S3', error);
    }
}


 const handler = async (event) =>{
   // Validate if this is a GET request
   if (!event.requestContext || !event.requestContext.http || !(event.requestContext.http.method === 'GET')) return sendError(400, 'Only GET method is supported', event);
   const path = event.requestContext.http.path;
    
    // An example of image path is /image/test.png
    var imagePathArray = path.split('/');
    // get the requested image operations
    const imageName = imagePathArray.pop();
     // remove -md,-sm from image name
    //  imagePathArray.push(imageName.replace(/-\w+(?=\.\w+$)/, ''));

     // get full path
    //  const originalImagePath = imagePathArray.length> 1 ? imagePathArray.join('/'):path;
    
    const { originalImageBody} = await downloadImageFromOriginalBucket(path);

    let transformedImage = Sharp(originalImageBody, { failOn: 'none', animated: true });

    const imageMetadata = await transformedImage.metadata();

    for(const [resolutionName, resolution] of Object.entries(constant.imageResolutions)) {
        const {}  =  resize(transformedImage, imageMetadata, resolution, imageName, resolutionName, imagePathArray);
    }

}

module.exports= handler;

(async ()=>handler({
    requestContext: {
        http: {
            method: 'GET',
            path: 'image-1696516150113.jpeg',
        }
    }
}))();