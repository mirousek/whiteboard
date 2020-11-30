Object.deepFreeze = function(obj) {
    Object.getOwnPropertyNames(obj).forEach((propertyName) => {
        let propertyValue = obj[propertyName];

        if (typeof propertyValue === "object") {
            Object.deepFreeze(propertyValue);
        }
    })

    return Object.freeze(obj);
}
