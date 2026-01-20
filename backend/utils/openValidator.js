// openValidator.js


function validateOpenAnswer(input, keywords) {
  if (!input || !keywords || keywords.length === 0) return 0;

  const text = input.toLowerCase();
  let found = 0;

  keywords.forEach(k => {
    if (text.includes(k.toLowerCase())) found++;
  });

  return Math.round((found / keywords.length) * 100);
}

module.exports = validateOpenAnswer;
