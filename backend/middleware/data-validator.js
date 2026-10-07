const Joi = require('joi');
const fs = require('fs');
const path = require('path');

module.exports = (req, res, next) => {
  try {
    const book = JSON.parse(req.body.book);

    const schema = Joi.object({
      title: Joi.string(),
      author: Joi.string().max(50),
      year: Joi.number().max(3000),
      genre: Joi.string().max(50),
    });

    const { error } = schema.validate({
      title: book.title,
      author: book.author,
      genre: book.genre,
      year: Number(book.year),
    });

    if (error !== undefined) {
      // Si Sharp a déjà créé une image, on la supprime
      if (req.file && req.file.filename) {
        const imagePath = path.join(
          __dirname,
          '../images',
          req.file.filename
        );

        fs.unlink(imagePath, (unlinkError) => {
          if (unlinkError) {
            console.error(
              "Erreur lors de la suppression de l'image :",
              unlinkError
            );
          }
        });
      }

      return res.status(400).json({ error });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error });
  }
};