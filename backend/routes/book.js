const express = require("express");

const router = express.Router();

const bookCtrl = require("../controllers/bookController");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sharp = require("../middleware/sharp");

router.get("/", bookCtrl.getAllBooks);
router.get("/:id", bookCtrl.getOneBook);

router.post("/", auth, multer, sharp, bookCtrl.createBook);
router.put("/:id", auth, multer, sharp, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);

router.post("/:id/rating", auth, bookCtrl.rateBook);
module.exports = router;