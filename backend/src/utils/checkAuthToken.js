const jwt = require('jsonwebtoken');

/**
 * Extracts the token from the authorization header of a request.
 *
 * @param {object} request - The HTTP request object.
 * @returns {string|null} - Returns the token if it starts with 'Bearer ', otherwise null.
 */
const getTokenFrom = (request) => {
    const authorization = request.get('authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7);
    }
    return null;
};

/**
 * Checks the validity of the JWT token in the authorization header of a request.
 *
 * @param {object} request - The HTTP request object.
 * @returns {object} - Returns an object with:
 *                      - status: {boolean} indicating whether the token is valid.
 *                      - data: {object|null} containing the decoded token's user info if valid, or an error response if invalid.
 *                      - admin: {boolean|undefined} indicating whether the user has admin privileges, if present in the token.
 */
const checkAuthToken = (request) => {
    const token = getTokenFrom(request);
    console.log("token= ", token);
    
    try {
        const decodedToken = jwt.verify(token, process.env.TOKEN);
        
        if (!token || !decodedToken.id) {
            return {
                status: false,
                data: response.status(401).json({ error: 'token missing or invalid' })
            };
        }
        
        return {
            status: true,
            data: decodedToken.user,
            admin: decodedToken.admin
        };
    } catch (e) {
        return {
            status: false,
            data: response.status(401).json({ error: 'token invalid' })
        };
    }
};

module.exports = {
    checkAuthToken
};
