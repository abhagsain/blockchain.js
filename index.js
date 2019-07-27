const express = require("express");
const app = express();
const uuid = require("uuid/v1");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const coolCoin = new Blockchain();
const NODE_ADDRESS = uuid()
  .split("-")
  .join("");
const PORT = 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", function(req, res) {
  res.redirect("/blockchain");
});
app.get("/blockchain", function(req, res) {
  res.send(coolCoin);
});
app.post("/transaction", function(req, res) {
  const { amount, sender, receiver } = req.body;
  if (amount && sender && receiver) {
    const transactionIndex = coolCoin.createNewTransaction(
      amount,
      sender,
      receiver
    );
    res.json({
      transactionIndex,
    });
  } else {
    return res.send({ error: "Sender, receiver & amount is required" });
  }
});
app.get("/mine", function(req, res) {
  // get previous block hash
  const previousBlock = coolCoin.getLastBlock();
  const previousHash = previousBlock.hash;
  // current block hash
  const currentBlock = {
    index: previousBlock.index + 1,
    transactions: coolCoin.pendingTransaction,
  };
  // a valid nounce
  const nounce = coolCoin.proofOfWork(previousHash, currentBlock);
  const currentHash = coolCoin.hashBlock(previousHash, currentBlock, nounce);
  // create a new block
  coolCoin.createNewTransaction(12.5, "00000", NODE_ADDRESS);
  res.json({
    block: coolCoin.createNewBlock(previousHash, currentHash, nounce),
  });
});
app.listen(PORT, (req, res) => {
  console.log(`Server Started @ ${PORT}`);
});
