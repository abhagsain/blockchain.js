const express = require("express");
const app = express();
const uuid = require("uuid/v1");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const rp = require("request-promise");
const bitcoin = new Blockchain();
const currentNodeURL = process.argv[3];
const NODE_ADDRESS = uuid()
  .split("-")
  .join("");
const PORT = process.argv[2];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", function(req, res) {
  res.redirect("/blockchain");
});
app.get("/blockchain", function(req, res) {
  res.send(bitcoin);
});
app.post("/transaction", function(req, res) {
  const { amount, sender, receiver } = req.body;
  if (amount && sender && receiver) {
    const transactionObject = bitcoin.createNewTransaction(
      amount,
      sender,
      receiver
    );
    bitcoin.addTransactionToPendingTransactions(transactionObject);
    const promises = [];
    bitcoin.networkNodes.forEach(node => {
      const requestOption = {
        uri: node + "/transaction/broadcast",
        method: "POST",
        body: { transaction: transactionObject },
        json: true,
      };
      promises.push(rp(requestOption));
    });
    Promise.all(promises).then(_ => {
      return res.json({ message: "Transaction added!!!!!!" });
    });
  }
});
app.post("/transaction/broadcast", (req, res) => {
  // This method will be called
  const { transaction } = req.body;
  console.log("TCL:  transaction" + PORT, transaction);

  if (transaction) {
    const transactionID = bitcoin.addTransactionToPendingTransactions(
      transaction
    );
    return res.json({ message: `Transaction Added ${transactionID}` });
  } else {
    return req.json({ error: "Value required" });
  }
});
app.post("/register-and-broadcast-node", (req, res) => {
  // Get the URL from the body
  // Add to the current node
  // Broadcast it to the other nodes in the network
  const { newNodeURL } = req.body;
  console.log("TCL: newNodeURL", newNodeURL);
  if (newNodeURL) {
    // Add it to the current node
    if (bitcoin.networkNodes.indexOf(newNodeURL) === -1) {
      bitcoin.networkNodes.push(newNodeURL);
    }
    if (bitcoin.currentNodeURL === newNodeURL) {
      return res.json({
        message: "Source and destination URLs must be different",
      });
    }
    // Broadcast the URL to the other nodes in the network
    const promises = [];
    bitcoin.networkNodes.forEach(networkNode => {
      console.log("TCL: networkNode", networkNode);
      const requestOption = {
        uri: networkNode + "/register-node",
        method: "POST",
        json: true,
        body: { newNodeURL },
      };
      promises.push(rp(requestOption));
    });
    Promise.all(promises)
      .then(_ => {
        const bulkRequestOption = {
          uri: newNodeURL + "/register-node-bulk",
          method: "POST",
          json: true,
          body: {
            networkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeURL],
          },
        };
        return rp(bulkRequestOption);
      })
      .then(data => {
        return res.json({ message: "New Node Add to the network" });
      })
      .catch(err => res.json({ err }));
  }
  // return res.json({ message: "Enter a URL to be added to the network" });
});
app.post("/register-node", (req, res) => {
  // Register the node with the
  const { newNodeURL } = req.body;
  if (newNodeURL) {
    const notAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeURL) === -1;
    const notCurrentURL = bitcoin.currentNodeURL !== newNodeURL;
    console.log("TCL: notAlreadyPresent", notAlreadyPresent);

    if (notAlreadyPresent && notCurrentURL) {
      // if newNodeURL isn't already present & it's not the current node
      bitcoin.networkNodes.push(newNodeURL);
      return res.json({ messge: "New Node Added" });
    } else return res.json({ message: "Node already present" });
  }
  return res.json({ message: "Please include a URL" });
});
app.post("/register-node-bulk", (req, res) => {
  // Get the network nodes from the body
  // Add it to the networkURL's array
  const { networkNodes } = req.body;
  if (
    networkNodes &&
    Array.isArray(networkNodes) &&
    networkNodes.length !== 0
  ) {
    networkNodes.forEach(node => {
      const notAlreadyPresent = bitcoin.networkNodes.indexOf(node) === -1;
      if (node !== bitcoin.currentNodeURL && notAlreadyPresent) {
        bitcoin.networkNodes.push(node);
      }
    });
    return res.json({ message: "Bulk add successful" });
  }
  return res.json({ message: "Please send valid data" });
});
app.get("/mine", function(req, res) {
  // get previous block hash
  const previousBlock = bitcoin.getLastBlock();
  const previousHash = previousBlock.hash;
  // current block hash
  const currentBlock = {
    index: previousBlock.index + 1,
    transactions: bitcoin.pendingTransaction,
  };
  // a valid nounce
  const nounce = bitcoin.proofOfWork(previousHash, currentBlock);
  const currentHash = bitcoin.hashBlock(previousHash, currentBlock, nounce);
  // create a new block
  const block = bitcoin.createNewBlock(previousHash, currentHash, nounce);
  // Push this block into the current node's chain
  bitcoin.addBlockToChain(block);
  const promises = [];
  bitcoin.networkNodes.forEach(node => {
    const requestOption = {
      method: "POST",
      uri: node + "/mine/broadcast",
      json: true,
      body: { block },
    };
    promises.push(rp(requestOption));
  });
  Promise.all(promises)
    .then(_ => {
      const requestOption = {
        uri: bitcoin.currentNodeURL + "/transaction",
        method: "POST",
        json: true,
        body: {
          amount: 12.5,
          sender: "000" + currentNodeURL,
          receiver: NODE_ADDRESS,
        },
      };
      return rp(requestOption);
    })
    .then(_ => {
      return res.json({ block });
    });
});
app.post("/mine/broadcast", (req, res) => {
  const { block } = req.body;
  const lastBlock = bitcoin.getLastBlock();
  if (
    block &&
    lastBlock.hash === block.previousHash &&
    lastBlock.index + 1 === block.index
  ) {
    bitcoin.addBlockToChain(block);
    bitcoin.pendingTransaction = [];
    res.json({ message: "ADDED" });
  } else {
    return res.json({ message: "Block rejected", block });
  }
});
app.listen(PORT, (req, res) => {
  console.log(`Server Started @ ${PORT}`);
});
