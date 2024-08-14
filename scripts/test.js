const p = require("phin");

(async () => {
  const res = await p("https://5hojib-hd-test-1.herokuapp.com/");
  console.log(res.statusCode === 200);
})();
