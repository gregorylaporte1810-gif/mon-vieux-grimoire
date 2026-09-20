const Book = require("../models/Book");
const fs = require("fs");

// Récupérer tous les livres
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

// Récupérer un seul livre
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

// Créer un livre
// Créer un livre
exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);

    delete bookObject._id;
    delete bookObject.userId;

    const initialRating = Number(bookObject.ratings?.[0]?.grade ?? 0);

    if (
      !Number.isInteger(initialRating) ||
      initialRating < 0 ||
      initialRating > 5
    ) {
      return res.status(400).json({
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    delete bookObject.ratings;
    delete bookObject.averageRating;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
      ratings: [
        {
          userId: req.auth.userId,
          grade: initialRating,
        },
      ],
      averageRating: initialRating,
    });

    book
      .save()
      .then(() => res.status(201).json({ message: "Livre enregistré !" }))
      .catch((error) => res.status(400).json({ error }));
  } catch (error) {
    res.status(400).json({ error });
  }
};

// Modifier un livre
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
      }
    : { ...req.body };

  delete bookObject.userId;
  delete bookObject._id;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre introuvable" });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Requête non autorisée" });
      }

      const oldImageUrl = book.imageUrl;

      Book.updateOne(
        { _id: req.params.id },
        {
          ...bookObject,
          userId: req.auth.userId,
        },
      )
        .then(() => {
          if (req.file && oldImageUrl) {
            const filename = oldImageUrl.split("/images/")[1];

            if (filename) {
              fs.unlink(`images/${filename}`, () => {});
            }
          }

          res.status(200).json({ message: "Livre modifié !" });
        })
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};

// Supprimer un livre
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre introuvable" });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Requête non autorisée" });
      }

      const filename = book.imageUrl.split("/images/")[1];

      Book.deleteOne({ _id: req.params.id })
        .then(() => {
          if (filename) {
            fs.unlink(`images/${filename}`, () => {});
          }

          res.status(200).json({ message: "Livre supprimé !" });
        })
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.rateBook = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const userId = req.auth.userId;

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({
        message: "Livre introuvable",
      });
    }

    const alreadyRated = book.ratings.some((item) => item.userId === userId);

    if (alreadyRated) {
      return res.status(400).json({
        message: "Vous avez déjà noté ce livre",
      });
    }

    book.ratings.push({
      userId,
      grade: rating,
    });

    const total = book.ratings.reduce((sum, item) => sum + item.grade, 0);

    book.averageRating = total / book.ratings.length;

    const updatedBook = await book.save();

    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error("Erreur notation :", error);

    return res.status(500).json({
      message: "Erreur lors de l'ajout de la note",
    });
  }
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};
