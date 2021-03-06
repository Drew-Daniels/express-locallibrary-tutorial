const mongoose = require('mongoose');
const { DateTime } = require('luxon');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxLength: 100},
    family_name: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

function dateFormatter(date) {
  return date ? DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED) : '';
}

function htmlDateFormatter(date) {
  return date ? DateTime.fromJSDate(date).toFormat('yyyy-MM-dd'): '';
}

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
// To avoid errors in cases where an author does not have either a family name or first name
// We want to make sure we handle the exception by returning an empty string for that case
  var fullname = '';
  if (this.first_name && this.family_name) {
    fullname = this.family_name + ', ' + this.first_name
  }
  if (!this.first_name || !this.family_name) {
    fullname = '';
  }
  return fullname;
});

// Virtual for author's lifespan
AuthorSchema.virtual('lifespan').get(function() {
  var lifetime_string = '';
  if (this.date_of_birth) {
    lifetime_string = this.date_of_birth.getYear().toString();
  }
  lifetime_string += ' - ';
  if (this.date_of_death) {
    lifetime_string += this.date_of_death.getYear()
  }
  return lifetime_string;
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});
AuthorSchema
.virtual('date_of_birth_formatted')
.get(function() {
  return dateFormatter(this.date_of_birth);
});
AuthorSchema
.virtual('date_of_death_formatted')
.get(function() {
  return dateFormatter(this.date_of_death);
});
AuthorSchema
.virtual('lifespan')
.get(function() {
  return this.get('date_of_birth_formatted') + ' - ' + this.get('date_of_death_formatted');
});
AuthorSchema
.virtual('date_of_birth_formatted_html')
.get(function() {
  return htmlDateFormatter(this.date_of_birth);
});
AuthorSchema
.virtual('date_of_death_formatted_html')
.get(function() {
  return htmlDateFormatter(this.date_of_death);
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);
