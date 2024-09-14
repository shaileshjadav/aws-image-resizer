import { useState, useEffect } from 'react'

const ResponsiveImage = ({ placeholderSrc, src, ...props }) => {
	const [imgSrc, setImgSrc] = useState(placeholderSrc);
  const [loading, setIsLoading] = useState(true);
  const IMGSIZES = {
	'sm':300,
	'md':500,
	'lg':1000,
	'xl':1200,
};
const basePath = 'CLOUDFRONT_URL';

const generateImagePath = (imagePath)=>{
	return basePath+imagePath;
};

  const generateVarints = (imageUrl) => {
    const variants = {};
  
    const imageParts = imageUrl.split('.');

    const ext = imageParts.pop();
    for(const size in IMGSIZES){
		const newURL = imageParts.join('')+'-'+size+'.'+ext;
        variants[size] = generateImagePath(newURL);
    }
	return variants;
    
    }

	useEffect(() => {
	    // update the image
	    const img = new Image();
	  	img.src = generateImagePath(src);
	  	img.onload = () => {
		    setImgSrc(src);
        setIsLoading(false);
		  };
	  }, []);
  
	  const variatns = generateVarints(src);
	  console.log(variatns);
	return (
		<picture>
			{Object.keys(IMGSIZES).map((size)=> <source media={`(max-width: ${IMGSIZES[size]}px)`} srcSet={variatns[size]}></source>)
			}
			<img
				{...{ src: generateImagePath(imgSrc), ...props }}
      			className={loading ?'loading':'loaded'}
				/>		
		</picture>
	
	);
}

export default ResponsiveImage;
