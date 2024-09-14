import { useState, useEffect } from 'react'

const ImageLoader = ({ placeholderSrc, src, ...props }) => {
	const [imgSrc, setImgSrc] = useState(placeholderSrc);
  const [loading, setIsLoading] = useState(true);

	useEffect(() => {
	    // update the image
	    const img = new Image();
	  	img.src = src;
	  	img.onload = () => {
		    setImgSrc(src);
        setIsLoading(false);
		  };
	  }, []);
  
  
	return (
		<img
			{...{ src: imgSrc, ...props }}
      className={loading ?'loading':'loaded'}
		/>
	);
}

export default ImageLoader;
