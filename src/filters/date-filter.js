module.exports = (value) => {
  const dateObject = new Date(value);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };

  return dateObject.toLocaleDateString('en-us', options);
};