import React, { useState, useEffect } from "react";
import "./screen1.scss";
import Web3 from "web3";
import BigNumber from "bignumber.js";
import { ethers } from 'ethers'
import {UseWalletProvider, useWallet} from 'use-wallet'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {tokenAddress, tokenAbi, chainIdConf, wbnb_address, token2_address, token2_Abi} from '../config/indexTetst'


const Screen2 = () => {
  const [account, setAccount] = useState('')
  const [tokenContract, setTokenContract] = useState({})
  const [token2_Contract, setToken2Contract] = useState({})
  const [networkStatus, setNetworkStatus] = useState(true)
  const [amount, setAmount] = useState(0)
  const [sellAmount, setSellAmount] = useState(0)
  const [sellButtonVisible, setSellButtonVisible] = useState(false)
  const [allowance, setAllowance] = useState()

  useEffect(async () => {
      await loadWeb3()
      await loadBlockchainData()
  },[account])

  useEffect(() => {
    window.ethereum.on('chainChanged', (chainId) => {
      if(chainId === chainIdConf) {
        setNetworkStatus(true)
      } else {
        toast.error('Wrong Network!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        })
        setNetworkStatus(false)
      }
    });
  }, [window.ethereum])
  
  useEffect(() => {
    window.web3 = new Web3(window.ethereum)
    const Tcontract = new window.web3.eth.Contract(tokenAbi, tokenAddress)
    setTokenContract(Tcontract)
    }, [])

  const loadWeb3 = async () => {
   
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      
    } 
    else if(window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } 
    else {
      window.alert("Non-ethereum browser detected. should consider trying MetaMask!")
    }
  }

  const loadBlockchainData = async () => {
    const web3 = window.web3
    var accounts = await web3.eth.getAccounts()
    setAccount(accounts[0])
    if(window.ethereum) {
      window.ethereum.on('accountsChanged', () =>  {
          web3.eth.getAccounts((error, accounts) => {
            setAccount(accounts[0])
          });
      });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if(!account || chainId !== chainIdConf) {
          setNetworkStatus(false)
      } else {
        setNetworkStatus(true)
      }
    }
    window.web3 = new Web3(window.ethereum)
    const T2contract = new window.web3.eth.Contract(token2_Abi, token2_address)
    setToken2Contract(T2contract)
    const allowancee = await T2contract.methods.allowance(accounts[0], tokenAddress).call()
    setAllowance(parseFloat(allowancee) / 1e9)

    if(parseFloat(allowancee) / 1e9 > 0) {
      setSellButtonVisible(true)
    } else {
      setSellButtonVisible(false)
    }
  }

  const connect = async () => {
    wallet.connect('injected')
    await window.ethereum
        .request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdConf }], //bsc 0x38 goerli 0x5
        })
        .then(() => {
        })
        .catch(async (err) => {
            if (err.code === 4902) {
                // addChain()
            }
        });
    window.web3 = new Web3(window.ethereum)
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    setAccount(accounts[0])
  }

  const handleClickBuy = () => {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const amountIn = ethers.utils.parseUnits(amount, 'ether');
    // const inputAmountHex = ethers.BigNumber.from((parseFloat(amount) * 1e18).toString()).toHexString();

    tokenContract.methods.swapExactETHForTokens(
        0,
        [wbnb_address, token2_address],
        account,
        deadlineHex
      ).send({value: amountIn, from: account}).once('receipt', (receipt) => {
        toast.success('Transaction is Success!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        })
    })
  }

  const handleClickSell = () => {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const amountIn = ethers.utils.parseUnits(sellAmount, 9);
    // const inputAmountHex = ethers.BigNumber.from((parseFloat(amount) * 1e18).toString()).toHexString();

    tokenContract.methods.swapExactTokensForETH(
        amountIn,
        0,
        [token2_address, wbnb_address],
        account,
        deadlineHex
      ).send({from: account}).once('receipt', (receipt) => {
        toast.success('Transaction is Success!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        })
    })
  }

  const handleClickApprove = async () => {
    const amount = 999999
    // const amountIn = ethers.utils.parseUnits(amount, 'ether');
    const calculatedApproveValue = BigNumber(amount*1e9);
    token2_Contract.methods.approve(tokenAddress, calculatedApproveValue).send({from : account})
      .then(() => {
        setSellButtonVisible(true)
      })
  }

  const handelChangeSellAmount = async (e) => {
    setSellAmount(e.target.value)
    if(allowance > 0) {
      setSellButtonVisible(true)
    } else {
      setSellButtonVisible(false)
    }
  }


  const wallet = useWallet()
  return (
    <div className="mainDiv">
      <button onClick={() => connect()} className="mainConnectButton"> 
        {
          account || 'Connect'
        }
      </button>
      <div style={{padding: '30px'}}>
        <input type="text" className="mainInput" placeholder="Type Amount..." onChange={(e) => setAmount(e.target.value)} />
        <button className="tryButton" onClick={() => handleClickBuy()}>Try Buy</button>
      </div>
      <div style={{padding: '30px'}}>
        <input type="text" className="mainInput" placeholder="Type Amount..." onChange={(e) => handelChangeSellAmount(e)} />
        <button className="tryButton" onClick={() => handleClickApprove()} style={{ display: sellButtonVisible ? "none" : "inline"}}>Try Approve</button>
        <button className="tryButton" onClick={() => handleClickSell()} style={{ display: sellButtonVisible ? "inline" : "none"}}>Try Sell</button>
      </div>
      <ToastContainer pauseOnFocusLoss={false} />
    </div>
  )
};

export default function Screen1() {
  return (
    <UseWalletProvider
      chainId={1}
      connectors={{
        fortmatic: { apiKey: '' },
        portis: { dAppId: '' },
        walletconnect: { rpcUrl: 'https://mainnet.eth.aragon.network/' },
        walletlink: { url: 'https://mainnet.eth.aragon.network/' },
      }}
    >
        <Screen2 />
      </UseWalletProvider>
  )
}
