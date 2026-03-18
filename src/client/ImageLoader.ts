import { StringMap } from "../StringMap";

export class ImageLoader {
	private static readonly MISSING_TEXTURE =
		ImageLoader.createMissingTexture();

	static createMissingTexture() {
		const canvas = document.createElement("canvas");
		canvas.width = 2;
		canvas.height = 2;

		const ctx = canvas.getContext("2d")!;
		ctx.imageSmoothingEnabled = false;
		
		const half = 1;

		const pink = "#ff00ff";
		const black = "#000000";

		ctx.fillStyle = pink;
		ctx.fillRect(0, 0, half, half);
		ctx.fillRect(half, half, half, half);

		ctx.fillStyle = black;
		ctx.fillRect(half, 0, half, half);
		ctx.fillRect(0, half, half, half);

		return canvas;
	}



	private images = new Map<string, HTMLImageElement>;


	async loadImages(images: StringMap) {
		const promises = Object.entries(images).map(([name, url]) => {
			return new Promise<void>((resolve, reject) => {
				const img = new Image();
				img.src = url;
	
				img.onload = () => {
					this.images.set(name, img);
					resolve();
				};
	
				img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
			});
		});
	
		await Promise.all(promises);
	}

	getImage(key: string) {
		const img = this.images.get(key);
		if (img)
			return img;

		return ImageLoader.MISSING_TEXTURE;
	}
}