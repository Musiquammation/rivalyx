export function obbCircleCollision(
	cx: number, cy: number,		// rectangle center
	w: number, h: number,		// rectangle size
	angle: number,				// rotation in radians
	circleX: number, circleY: number,
	radius: number
): boolean {

	// 1. Translate circle center into rectangle space
	const dx = circleX - cx;
	const dy = circleY - cy;

	// 2. Apply inverse rotation to align rectangle with axes
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	const localX =  dx * cos + dy * sin;
	const localY = -dx * sin + dy * cos;

	// 3. Axis-aligned rectangle half extents
	const halfW = w * 0.5;
	const halfH = h * 0.5;

	// 4. Find closest point on rectangle to circle center
	const closestX =
		localX < -halfW ? -halfW :
		localX >  halfW ?  halfW :
		localX;

	const closestY =
		localY < -halfH ? -halfH :
		localY >  halfH ?  halfH :
		localY;

	// 5. Compute squared distance to closest point
	const diffX = localX - closestX;
	const diffY = localY - closestY;

	// 6. Collision test
	return (diffX * diffX + diffY * diffY) <= radius * radius;
}
