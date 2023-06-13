import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")

const donor = document.getElementById("donor")

connectButton.onclick = connect
fundButton.onclick = fund
withdrawButton.onclick = withdraw

//Modals----
const fundclose = document.getElementById("fundclose")
const fundx = document.getElementById("fundx")
const withdrawclose = document.getElementById("withdrawclose")
const withdrawx = document.getElementById("withdrawx")

fundclose.onclick = reloadPage
fundx.onclick = reloadPage
withdrawclose.onclick = reloadPage
withdrawx.onclick = reloadPage

let text
window.onload = function () {
    getBalance()
    donorbutton()
}

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" })
        connectButton.innerHTML = "Connected"
    } else {
        connectButton.innerHTML = "Please Install MetaMask"
        $("#metaModal").modal("show")
        // alert("Please Install MetaMask")
    }
}

function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}...`)
    return new Promise((resolve, rejects) => {
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            console.log(
                `Completed with ${transactionReceipt.confirmations} confirmations`
            )
            resolve()
        })
    })
}

async function getBalance() {
    if (typeof window.ethereum != "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const balance = await provider.getBalance(contractAddress)
        console.log(ethers.utils.formatEther(balance))
        text = ethers.utils.formatEther(balance)
        balanceButton.innerHTML = text + "ETH"
    }
}

function donorbutton() {
    // const owner = "0x14a72d6ccdeb2199e18d4bc2a9a9afa0f22be46d"
    async function fetchTransactions() {
        const apiKey = "TF42EYG5JM9C7KQQ2WA786H5KX9M2WYA73"

        const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&apikey=${apiKey}`

        const response = await fetch(url)
        const data = await response.json()

        return data.result
    }
    async function displayTransactions() {
        const transactions = await fetchTransactions()

        var tablebody = document.querySelector("#mytable tbody")
        // const transactionsArray = transactions.split(",")
        transactions.forEach((transaction) => {
            var newRow = document.createElement("tr")
            var statuscell = document.createElement("td")
            var methodcell = document.createElement("td")
            var agecell = document.createElement("td")
            var fromcell = document.createElement("td")
            var tocell = document.createElement("td")
            var amountcell = document.createElement("td")

            var ind

            if (transaction.txreceipt_status == "0") {
                ind = "Failed"
            } else if (transaction.txreceipt_status == "1") {
                ind = "Passed"
            }
            const unixTimestamp = transaction.timeStamp
            const date = new Date(unixTimestamp * 1000)
            const dateString = `${date.getDate()}/${
                date.getMonth() + 1
            }/${date.getFullYear()} ${date.toLocaleTimeString()}`
            console.log(dateString)

            var met
            if (transaction.functionName == "fund()") {
                met = "Fund"
            } else if (transaction.functionName == "withdraw()") {
                met = "Withdraw"
            } else {
                met = "Transfer"
            }

            statuscell.textContent = ind
            methodcell.textContent = met
            agecell.textContent = dateString
            fromcell.textContent = `${transaction.from}`
            tocell.textContent = `${transaction.to}`
            amountcell.textContent = `${transaction.value / 1e18} ETH`

            newRow.appendChild(statuscell)
            newRow.appendChild(methodcell)
            newRow.appendChild(agecell)
            newRow.appendChild(fromcell)
            newRow.appendChild(tocell)
            newRow.appendChild(amountcell)

            tablebody.appendChild(newRow)

            console.log(transaction)
        })
    }

    displayTransactions()
}

async function fund() {
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount}...`)
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            })
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done!")
            $("#fundModal").modal("show")
        } catch (error) {
            console.log(error.code)
            if (error.code == "INVALID_ARGUMENT") {
                $("#invalidModal").modal("show")
            } else if (error.code == "UNPREDICTABLE_GAS_LIMIT") {
                $("#lessModal").modal("show")
            } else if (error.code == "4001") {
                $("#cancelModal").modal("show")
            } else if (error.code == "INSUFFICIENT_FUNDS") {
                $("#insufficientModal").modal("show")
            }
        }
    }
}

async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        console.log("Withdrawing...")
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.withdraw()
            await listenForTransactionMine(transactionResponse, provider)
            $("#withdrawModal").modal("show")
        } catch (error) {
            console.log(error.code)
            if (error.code == "4001") {
                $("#cancelModal").modal("show")
            } else if (error.code == "UNPREDICTABLE_GAS_LIMIT") {
                $("#unauthorizedModal").modal("show")
            }
        }
    }
}

function reloadPage() {
    location.reload()
}
