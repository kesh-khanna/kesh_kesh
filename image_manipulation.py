import cv2

"""
For basic manipulation of images
"""

def rotate(img_path, deg=90):
    """
    rotate image and save at same path
    """
    # Read the image from the given path
    image = cv2.imread(img_path)

    # Get the image dimensions
    (h, w) = image.shape[:2]

    # Calculate the center of the image
    center = (w // 2, h // 2)

    # Perform the rotation
    M = cv2.getRotationMatrix2D(center, deg, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h))

    # Save the rotated image back to the same path
    cv2.imwrite(img_path, rotated)