const SHA256 = require("sha256");
const Blockchain = function() {
  this.chain = [];
  this.pendingTransaction = [];
  //   Creates a genesis block (first block of our blockchain)
  this.createNewBlock("0", "0", 0);
};
Blockchain.prototype.createNewBlock = function(previousHash, hash, nounce) {
  const block = {
    index: this.chain.length + 1,
    time: Date.now(),
    transactions: this.pendingTransaction,
    nounce,
    hash,
    previousHash,
  };
  this.pendingTransaction = [];
  this.chain.push(block);
  return block;
};
Blockchain.prototype.hashBlock = function(previousHash, currentBlock, nounce) {
  const dataAsString =
    previousHash + JSON.stringify(currentBlock) + nounce.toString();
  return SHA256(dataAsString);
};
Blockchain.prototype.createNewTransaction = function(amount, sender, receiver) {
  const transaction = {
    amount,
    sender,
    receiver,
  };
  this.pendingTransaction.push(transaction);
  return this.getLastBlock()["index"] + 1;
};
Blockchain.prototype.proofOfWork = function(previousHash, currentBlock) {
  let nounce = 0;
  let hash = this.hashBlock(previousHash, currentBlock, nounce);
  while (hash.substring(0, 4) !== "0000") {
    nounce += 1;
    hash = this.hashBlock(previousHash, currentBlock, nounce);
  }
  return nounce;
};
Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};
module.exports = Blockchain;
