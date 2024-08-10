from PIL import Image


# Stitches images together into a looping gif!
def create_gif(image_paths, output_path, duration_per_frame):
    # Load images
    images = [Image.open(img_path) for img_path in image_paths]

    # Convert images to RGB
    images = [img.convert("RGB") for img in images]
    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        duration=duration_per_frame * 1000,
        loop=0,  # 0 for infinite loop, or specify the number of loops
    )


image_files = [
    "Life.png",
    "Brain.png",
    "Elementary.png",
    "Wireworld.png",
    "RPS.png",
    "Neural.png",
]
create_gif(image_files, "Thumbnail.gif", 1)
