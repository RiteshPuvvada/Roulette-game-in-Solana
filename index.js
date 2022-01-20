const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");

const web3 = require("@solana/web3.js");


const { getReturnAmount, totalAmtToBePaid, randomNumber } = require('./helper');
const { getWalletBalance, transferSOL, airDropSol } = require("./solana");

// Establishing Connection

const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
console.log(connection);

const init = () => {
    console.log(
        chalk.magenta(
            figlet.textSync("SOL Stake", {
                font: "Standard",
                horizontalLayout: "default",
                verticalLayout: "default"
            })
        )
    );
    console.log(chalk.red`The max bidding amount is 2.5 SOL`);
};

// Generating Address and Funds

// const userWallet = web3.Keypair.generate();
// console.log(userWallet);

/*
Keypair {
    _keypair: {
        publicKey: Uint8Array(32) [
            138,  29, 130, 165, 170,  49,  59,
            35, 222, 175,  55, 210, 137,  93,
            125, 151,   2, 113, 151, 187, 228,
            111, 242, 205, 213, 242,  37,  44,
            177, 145, 116, 163
        ],
        secretKey: Uint8Array(64) [
            150, 168, 183,  86, 183, 125, 230, 219, 101, 159,
            183, 175, 193, 253,  56, 171,  58, 114, 131, 203,
            196, 244, 127, 153, 185, 157, 128, 117,   5, 165,
            41, 168, 138,  29, 130, 165, 170,  49,  59,  35,
            222, 175,  55, 210, 137,  93, 125, 151,   2, 113,
            151, 187, 228, 111, 242, 205, 213, 242,  37,  44,
            177, 145, 116, 163
        ]
    }
}
 */

/*const userPublicKey = [
    138, 29, 130, 165, 170,  49,  59,
    35, 222, 175,  55, 210, 137,  93,
    125, 151,   2, 113, 151, 187, 228,
    111, 242, 205, 213, 242,  37,  44,
    177, 145, 116, 163
]
*/
const userSecretKey = [
    150, 168, 183,  86, 183, 125, 230, 219, 101, 159,
    183, 175, 193, 253,  56, 171,  58, 114, 131, 203,
    196, 244, 127, 153, 185, 157, 128, 117,   5, 165,
    41, 168, 138,  29, 130, 165, 170,  49,  59,  35,
    222, 175,  55, 210, 137,  93, 125, 151,   2, 113,
    151, 187, 228, 111, 242, 205, 213, 242,  37,  44,
    177, 145, 116, 163
]

const userWallet = web3.Keypair.fromSecretKey(Uint8Array.from(userSecretKey));

//Treasury

const secretKey = [
    237, 75, 32, 92, 130, 143, 45, 166, 12, 45, 253,
    118, 29, 18, 105, 244, 8, 123, 236, 159, 109, 140,
    183, 248, 97, 82, 61, 130, 180, 60, 144, 246, 56,
    173, 106, 16, 150, 188, 92, 12, 221, 141, 127, 101,
    219, 18, 170, 52, 17, 200, 203, 134, 46, 48, 50,
    14, 118, 32, 94, 91, 57, 222, 10, 223
]

const treasuryWallet = web3.Keypair.fromSecretKey(Uint8Array.from(secretKey));

const askQuestions = () => {
    const questions = [
        {
            name: "SOL",
            type: "number",
            message: "What is the amount of SOL you want to stake?",
        },
        {
            type: "rawlist",
            name: "RATIO",
            message: "What is the ratio of your staking?",
            choices: ["1:1.25", "1:1.5", "1.75", "1:2"],
            filter: function (val) {
                const stakeFactor = val.split(":")[1];
                return stakeFactor;
            },
        },
        {
            type: "number",
            name: "RANDOM",
            message: "Guess a random number from 1 to 5 (both 1, 5 included)",
            when: async (val) => {
                if (parseFloat(totalAmtToBePaid(val.SOL)) > 5) {
                    console.log(chalk.red`You have violated the max stake limit. Stake with smaller amount.`)
                    return false;
                } else {
                    // console.log("In when")
                    console.log(`You need to pay ${chalk.green`${totalAmtToBePaid(val.SOL)}`} to move forward`)
                    const userBalance = await getWalletBalance(userWallet.publicKey.toString())
                    if (userBalance < totalAmtToBePaid(val.SOL)) {
                        console.log(chalk.red`You don't have enough balance in your wallet`);
                        return false;
                    } else {
                        console.log(chalk.green`You will get ${getReturnAmount(val.SOL, parseFloat(val.RATIO))} if guessing the number correctly`)
                        return true;
                    }
                }
            },
        }
    ];
    return inquirer.prompt(questions);
};


const gameExecution = async () => {
    init();
    const generateRandomNumber = randomNumber(1, 5);
    //console.log("Generated number",generateRandomNumber);
    const answers = await askQuestions();
    if (answers.RANDOM) {
        const paymentSignature = await transferSOL(userWallet, treasuryWallet, totalAmtToBePaid(answers.SOL))
        console.log(`Signature of payment for playing the game`, chalk.green`${paymentSignature}`);

        if (answers.RANDOM === generateRandomNumber) {
            // AirDrop Winning Amount

            await airDropSol(treasuryWallet, getReturnAmount(answers.SOL, parseFloat(answers.RATIO)));
            // guess is successfull

            const prizeSignature = await transferSOL(treasuryWallet, userWallet, getReturnAmount(answers.SOL, parseFloat(answers.RATIO)))

            console.log(chalk.green`Your guess is absolutely correct`);
            console.log(`Here is the price signature `, chalk.green`${prizeSignature}`);

        } else {
            // better luck next time

            console.log(chalk.yellowBright`Better luck next time`)
        }
    }
}

gameExecution()