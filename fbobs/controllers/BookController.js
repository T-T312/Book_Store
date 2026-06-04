class BookController {
  constructor(bookRepository) {
    this.bookRepository = bookRepository;
  }

  getAll(req, res) {
    const { search, genre } = req.query;
    res.json(this.bookRepository.findAll(search, genre));
  }

  getAllAdmin(req, res) {
    res.json(this.bookRepository.findAllAdmin());
  }

  getGenres(req, res) {
    res.json(this.bookRepository.getGenres());
  }

  getOne(req, res) {
    const book = this.bookRepository.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
  }

  create(req, res) {
    const { title, author, price } = req.body;
    if (!title || !author || !price) return res.json({ error: 'Title, author, price required' });
    const result = this.bookRepository.create(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  }

  update(req, res) {
    this.bookRepository.update(req.params.id, req.body);
    res.json({ success: true });
  }

  delete(req, res) {
    this.bookRepository.deactivate(req.params.id);
    res.json({ success: true });
  }
}

module.exports = BookController;
