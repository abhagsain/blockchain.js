const Blockchain = require("./blockchain");
const bitcoin = new Blockchain();
bitcoin.createNewBlock(124, "VOAISJDFK325", "6879SIDFFSDFG");
bitcoin.createNewTransaction(100, "C155", "C255");
bitcoin.createNewTransaction(100, "C255", "C355");
bitcoin.createNewBlock(124123, "VOAISJDFK325", "ASDFASDF6879SIDFFSDFG");
const currentBlock = [
  {
    amount: 100,
    sender: "A",
    receiver: "V",
  },
  {
    amount: 10,
    sender: "ANURAG5678UAIOSFGM",
    receiver: "VIPANSHA8SFUISDFAFS8DHA808SAD",
  },
  {
    amount: 1230,
    sender: "ANURAG5678UAIOSFGM",
    receiver: "VIPANSHA8SFUISDFAFS8DHA808SAD",
  },
];
const previousHash = "ANURAG56789A09F";
const nounce = bitcoin.proofOfWork(previousHash, currentBlock);
console.log(nounce);
console.log(bitcoin.hashBlock(previousHash, currentBlock, nounce));
console.log(bitcoin);
