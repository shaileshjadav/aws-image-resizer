# On Fly Image Resizing using CloudFront and Lambda@Edge in NodeJS

Here lets discuss architecture which generate different variants of image like (small, medium, large etc) whenever browser (front-end) asks.

## Description
- Request image from browser (make sure have image was uploaded s3 before creating cloudfront) in format https://mycloudfront.net/images/test-{format}.png (format values: sm, md, lg, xl).
- If requested format was not generated before then it trigger lamda function and generate image variant on same path of S3.

## Architecture:
![image](https://github.com/user-attachments/assets/b2b1e849-6c95-4899-b508-c31a8d2a8b62)
