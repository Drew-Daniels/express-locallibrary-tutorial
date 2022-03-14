var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

const { body,validationResult } = require('express-validator');
const async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
      });
  
  };
  

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {

    BookInstance.findById(req.params.id).exec(function(err, book_instance) {
        if (err) {return next(err);}
        if (book_instance==null) {
            res.redirect('/catalog/bookinstances');
        }
        // Successful
        res.render('bookinstance_delete', { title: 'Delete Book Instance', book_instance: book_instance})
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    // no need to find dependent objects bc there are none for bookinstances
    BookInstance.findByIdAndDelete(req.params.id, function deleteBookInstance(err) {
        if (err) { return next(err); }
        // Success
        res.redirect('/catalog/bookinstances')
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {

    // get an array of all books to pass to the bookinstance_form
    async.parallel({
        book_instance: function(callback) {
            BookInstance.findById(req.params.id).exec(callback)
        },
        book_list: function(callback) {
            Book.find().exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book_instance == null) {
            let err = new Error('Book Instance not found');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('bookinstance_form', {title: 'Update Book Instance', bookinstance: results.book_instance, book_list: results.book_list});
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate and sanitize fields
    body('imprint', 'Imprint must not be empty').trim().isLength({ min: 1}).escape(),

    // Process request after validation and sanitation
    (req, res, next) => {
        
        // Extract the validation erros from a request
        const errors = validationResult(req);

        // Create a Book Instance object with escaped/trimmed data and old id
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            Book.find().exec(function(err, book_list) {
                if (err) { return next(err); }
                res.render('bookinstance_form', {title: 'Update Book Instance', bookinstance: bookInstance, book_list: book_list, errors: errors.array()});    
            });
        }
        else {
            // Data from form is valid. Update the document
            BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, function(err, thebookinstance) {
                if (err) { return next(err); }
                // Successful - redirect to the genre detail page
                res.redirect(thebookinstance.url);
            });
        }
    }
];
