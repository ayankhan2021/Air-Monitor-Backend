const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch(next);  // No need to wrap next in a function
    };
};

export { asyncHandler };
