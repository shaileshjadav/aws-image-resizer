
const {S3Client, GetObjectCommand, PutObjectCommand} = require("@aws-sdk/client-s3");
const Sharp = require("sharp");

const constant =require("./constant");
require('dotenv').config();

const s3Client = new S3Client({,
    region : process.env.AWS_LAMBDA_REGION || 'region',
});

const S3_BUCKET = process.env.BUCKET_NAME || 'BUCKET_NAME';
const TRANSFORMED_IMAGE_CACHE_TTL = "60";

const resize = async (transformedImage, info, contentType, resolution, destinationPath) => {
    try {
        let imageHeight = null;
        let imageWidth = null;

        if (info.height >= info.width && info.height > resolution.size) {
            imageWidth = resolution.size;
        }
        if (info.width > resolution.size) {
            imageHeight = resolution.size;
        }

        
        const resizedImageBuffer = await transformedImage.resize({
                                width: imageWidth,
                                height: imageHeight,
                            }).toBuffer();
        console.log(`resizedImageBuffer`);
        console.log(`started uploading in aws`);
        // upload to aws
        
        console.log("executing put command", destinationPath);
        const putImageCommand = new PutObjectCommand({
            Body: resizedImageBuffer,
            Bucket: S3_BUCKET,
            Key: destinationPath,
            ContentType: contentType,
            Metadata: {
                'cache-control': TRANSFORMED_IMAGE_CACHE_TTL,
            },
        })
        await s3Client.send(putImageCommand);
        console.log("Image uploaded successfully!", destinationPath);
        return resizedImageBuffer;
    }
    catch (error) {
        console.log('Could not upload transformed image to S3', error);
    }
}

const downloadImageFromOriginalBucket = async (originalImagePath) => {
   // Downloading original image
    try {
        const getOriginalImageCommand = new GetObjectCommand({ Bucket: S3_BUCKET, Key: originalImagePath });
        const getOriginalImageCommandOutput = await s3Client.send(getOriginalImageCommand);
        console.log(`Got response from S3 for ${originalImagePath}`);

        const originalImageBody = await getOriginalImageCommandOutput.Body.transformToByteArray();
        const contentType = getOriginalImageCommandOutput.ContentType;
        return { originalImageBody, contentType};
    } catch (error) {
        console.log('Error downloading original image', error);
        throw error;
    }
}


// Function to parse the file path and extract base name, variant, and extension
const parseFilePath = (filePath) => {
    // Split into directory and file
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop(); // Get the last part, which is the file name
    const directory = pathParts.join('/'); // The rest is the directory
    
    // Split the file name into base name, variant, and extension
    const match = fileName.match(/^(.+?)(-\w+)?(\.\w+)$/);

    if (!match) {
        throw new Error('Invalid file name format');
    }

    const baseName = match[1]; // 'test' in 'test-sm.png'
    const variant = match[2] || ''; // '-sm' in 'test-sm.png', or empty string if none
    const extension = match[3]; // '.png' in 'test-sm.png'
    
    return {
        baseName,
        variant: variant.startsWith('-')?variant.substring(1): variant, // remove - -sm to sm.
        extension,
        destinationPath: filePath,
        originalImagePath: directory ? `${directory}/${baseName}${extension}`: `${baseName}${extension}`,
    };
}

 const handler = async (event, context, callback) =>{
    console.log(event);
   // Validate if this is a GET request
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;
    let path = request.uri.startsWith('/') ? request.uri.substring(1) : request.uri; //remove leading slash /
    const distributionDomainName =  event.Records[0].cf.config.distributionDomainName;
    const cloudfrontDomainName= `https://${distributionDomainName}/`;

    if (response.status == 404 || response.status == 403) {
        try {
            const { baseName, variant, extension, destinationPath, originalImagePath } = parseFilePath(path);
            
            console.log("parsedFile",{ baseName, variant, extension, destinationPath, originalImagePath });
            
            if(!variant){
                return callback(null, response);
            }
            
            console.log("starting downloading..for ",originalImagePath);
            const { originalImageBody, contentType} = await downloadImageFromOriginalBucket(originalImagePath);
            console.info("start sharp ", {contentType});

            let transformedImage = Sharp(originalImageBody, { failOn: 'none', animated: true });
            const imageMetadata = await transformedImage.metadata();
            console.info("imageMetadata", imageMetadata);
            let responseContentType;
            switch (extension) {
                case '.jpeg': responseContentType = 'image/jpeg'; break;
                case '.gif': responseContentType = 'image/gif'; break;
                case '.webp': responseContentType = 'image/webp'; break;
                case '.png': responseContentType = 'image/png'; break;
                case '.avif': responseContentType = 'image/avif'; break;
                default: responseContentType = 'image/jpeg';
            }
            
            const results = await resize(transformedImage, imageMetadata, contentType, constant.imageResolutions[variant], destinationPath);


            console.log(results);

            

            // modify response and headers
            response.status = 200;
            response.statusDescription = 'OK';
            response.body = results.toString('base64');
            response.bodyEncoding = 'base64';
            response.isBase64Encoded = true;

            response.headers['cache-control'] = [{key: 'Cache-Control', value: 'max-age=3600'}]; 
            response.headers['content-type'] = [{key: 'Content-Type', value: responseContentType}]; 

            // return modified response
            callback(null, response);
        }
        catch (error){
            console.log('Error processing request', error);
            
            response.status = 500;
            response.statusDescription = 'INTERNAL_SERVER_ERROR';
            
            return callback(null, response)
        }
        
    }
    
    return callback(null, response);
}

exports.handler = handler;
