window.numbersLib = {
    generateRandomNumber: function () {
        return Math.ceil(Math.random() * 99);
    },
    alternateNumber: window.alternateNumber = function (oldNum) {
        var isEven = oldNum % 2 === 0;
        var isOdd = ! isEven;
        var isLessThan = oldNum < 50;
        var isGreaterThan = ! isLessThan;
        var rand = Math.round(Math.random() * 24); // 0 - 24

        if (isEven && isLessThan) {
            num = rand * 2 + 1 + 50; // Odd (51 - 99)
        } else if (isEven && isGreaterThan) {
            num = rand * 2 + 1; // Even (1 - 49)
        } else if (isOdd && isLessThan) {
            num = rand * 2 + 50; // Even (50 - 98)
        } else if (isOdd && isGreaterThan) {
            num = rand * 2; // Even (0 - 48)
        }

        return num;
    }
};