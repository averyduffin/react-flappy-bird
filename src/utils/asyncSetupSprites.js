import * as PIXI from 'pixi.js';
const { Rectangle, Texture } = PIXI;

const  asyncSetupSprites = (resource, spriteSheet) => {
//   const texture = await Texture.fromExpoAsync(resource);
//   const texture = Texture.fromBuffer(resource, 189, 192, {});
  const texture = Texture.from(resource);
//  console.log(spriteSheet)
  let textures = {};
  for (const sprite of spriteSheet) {
    const { name, x, y, width, height } = sprite;
    try {
      const frame = new Rectangle(x, y, width, height);
      textures[name] = new Texture(texture.baseTexture, frame);
    } catch ({ message }) {
      console.error(message);
    }
  }
  return textures;
}

export default asyncSetupSprites;
