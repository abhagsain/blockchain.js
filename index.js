const express = require("express");
const app = express();
const PORT = 5000;

app.get("/blockchain", function(req, res) {});
app.post("/transaction", function(req, res) {});
app.get("/mine", function(req, res) {});
app.listen(PORT, (req, res) => {
  console.log(`Server Started @ ${PORT}`);
});
