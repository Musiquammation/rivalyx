import { StringMap } from "../StringMap";

export class ImageLoader {
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

		throw new Error("Failed to get image");
	}
}