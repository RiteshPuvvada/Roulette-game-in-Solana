function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function totalAmtToBePaid(investment){
    return investment;
}

function getReturnAmount(investment, stakeFactor){
    return investment*stakeFactor;
}

// const test = randomNumber(1,5);
// console.log(test)

module.exports = {
    randomNumber, 
    totalAmtToBePaid, 
    getReturnAmount
};