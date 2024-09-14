import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ImageLoader from "./ResponsiveImage";

function App() {
  const images = [
    {
      placeholderSrc: 'test-sm.png',
      src: 'test.png'
    },
    {
      placeholderSrc: 'images/pexels-hiteshchoudhary-1261427-sm.jpg',
      src: 'images/pexels-hiteshchoudhary-1261427.jpg'
    },
    {
      placeholderSrc: 'test-sm.png',
      src: 'test.png'
    },
    {
      placeholderSrc: 'images/pexels-hiteshchoudhary-1261427-sm.jpg',
      src: 'images/pexels-hiteshchoudhary-1261427.jpg'
    },
    {
      placeholderSrc: 'image-1696516150113-sm.jpeg',
      src: 'image-1696516150113.jpeg'
    },
    {
      placeholderSrc: 'test-sm.png',
      src: 'test.png'
    },
    {
      placeholderSrc: 'images/18697-sm.jpg',
      src: 'images/18697.jpg'
    },
    {
      placeholderSrc: 'images/pexels-eberhardgross-1366919-sm.jpg',
      src: 'images/pexels-eberhardgross-1366919.jpg'
    },
  ]

  return (
    <>
    
    <div className="gallery-container">

        <div className="gallery">
          {images.map((image, index) => (
          <ImageLoader 
            key={index}
            placeholderSrc={image.placeholderSrc}
            src ={image.src}
            alt={`Gallery image ${index + 1}`}
            />
            
          ))}
        </div>
        </div>
    </>
  )
}

export default App
