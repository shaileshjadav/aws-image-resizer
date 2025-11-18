# On Fly Image Processing using CloudFront and Lambda@Edge in NodeJS

This architecture generates responsive image variants (small, medium, large, XL, etc.) dynamically whenever the browser requests them, without pre-generating or storing all variants upfront

## Description
Frontend can request images in different sizes using a simple URL format:

`https://mycloudfront.net/images/test-{format}.png`

Where `{format}` can be:

| Format | Size (Example) |
|--------|----------------|
| `sm`   | Small          |
| `md`   | Medium         |
| `lg`   | Large          |
| `xl`   | Extra Large    |


## How it works

1. Browser requests an image with a specific variant suffix.  
2. CloudFront checks if the variant exists in S3.  
3. If variant **does not exist**, CloudFront triggers **Lambda@Edge**.  
4. Lambda@Edge:  
   - Fetches original image from S3  
   - Resizes using Sharp  
   - Saves the resized image to S3  
   - Returns the new image to the browser  
5. Future requests serve directly from CloudFront/S3 (cached).

## Architecture:
<img width="813" height="380" alt="Screenshot 2025-11-18 174134" src="https://github.com/user-attachments/assets/a6a46c51-f1e8-475c-a97b-a1226806a851" />


## Flow Overview

1. **User Requests Variant** 
    - `/images/photo-md.jpg`

2. **CloudFront Behavior**  
    - Checks S3 origin  
    - If found → return immediately  
    - If not found → invoke Lambda@Edge function  

3. **Lambda@Edge Task**  
    - Extracts variant (sm/md/lg/xl)  
    - Downloads original image from S3  
    - Resizes with Sharp  
    - Uploads resized file to S3  
    - Returns processed image to client  

4. **CloudFront Caching**  
    - Edge location caches the new image  
    - Future requests load instantly

---

##  Benefits

- Low latency (edge caching)  
- No need to pre-generate variants  
- Reduced storage cost  
- Simple frontend integration  
- Fully serverless (S3 + CloudFront + Lambda@Edge)  

---

##  Requirements

- AWS S3 bucket  
- AWS CloudFront distribution  
- Lambda@Edge function  
- Node.js with Sharp (via Lambda Layer)  
- Consistent image naming pattern (`image-sm.jpg`)  

---



