const sharp = require("sharp");
const path = require("path");

module.exports = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filename =
      req.file.originalname
        .split(" ")
        .join("_")
        .split(".")[0] +
      "_" +
      Date.now() +
      ".webp";

    await sharp(req.file.buffer)
      .resize({
        width: 800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(path.join(__dirname, "../images", filename));

    req.file.filename = filename;

    next();
  } catch (error) {
    res.status(400).json({ error });
  }
};