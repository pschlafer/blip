/**
 * Copyright (c) 2014, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 */

var _ = require('lodash');

// Use if you need to execute something that will call an action,
// immediately after responding to a store change event
// (ex: redirecting after a store updated with a particular value)
// Warning: generally considered an "anti-flux pattern", use only if you need to
module.exports = function(callback) {
  // Allow stores to finish updating before executing callback
  _.defer(callback);
};
