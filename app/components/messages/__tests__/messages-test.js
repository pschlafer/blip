/**
 * Copyright (c) 2015, Tidepool Project
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

/*global describe, it, jest, expect */

jest.dontMock('../messages');

var _ = require('lodash');
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;

var Messages = require('../messages');

// var mockData = require('blip-mock-data');
// var mockMessages = mockData.messagenotes;

// describe('Messages', function() {
// 	it('does not require any props', function() {
// 		var renderedMessages = TestUtils.renderIntoDocument(
// 			<Messages />
// 		);
// 		expect(_.isEmpty(renderedMessages.state)).toBe(true);
// 	});
// 	it('receives messages from the server in a prop and puts them in state', function() {
// 		var renderedMessages = TestUtils.renderIntoDocument(
// 			<Messages messages={mockMessages} />
// 		);
// 		expect(Array.isArray(renderedMessages.state.messages)).toBe(true);
// 	});
// });