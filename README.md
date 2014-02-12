Wigslace (v2)
=============

Wigslace live chat system. Utilises a Node.js server running socket.io, express,
less and swig.

Client
------

The chat client page has a number of custom JavaScript events that it fires.

### Order of events

**On connect:**

1. `wl:socket:ready`
2. A number of `wl:socket:join`
3. A `wl:socket:userData` for each of the above (will occur over time)
4. `wl:socket:scrollback`
5. Message creation events (see subheading) for each message in the scrollback

**On message recieved:**

1. `wl:socket:message:recieve`
2. Message creation events (see subheading)

**On message creation:**

1. `wl:message:create` **OR** `wl:message:append`
2. `wl:message:new`

### Socket events

Event Name | Triggered On | Argument | Called When
--- | ---  | --- | ---
`wl:socket:ready` | `document` | None | The socket.io connection is established.
`wl:socket:message:send` | `document` | The message text being sent | The client is just about to send a message to the server.
`wl:socket:message:recieve` | `document` | The message data object | The client recieves a message from the server.
`wl:socket:scrollback` | `document` | Array of message data objects | The server sends a scrollback event.
`wl:socket:userData` | `document` | User data recieved | The server responds to a request for data on a user.
`wl:socket:join` | `document` | User ID | A user has joined the chat.
`wl:socket:part` | `document` | User ID | A user has left the chat.

### Message Events

Event Name | Triggered On | Argument | Called When
--- | ---  | --- | ---
`wl:message:create` | The message DOM node | Message data object | A new message DOM node is created
`wl:message:append` | The message DOM node | Message data object | A new DOM node is not required, and the client appends the message to an existing one.
`wl:message:new` | The message DOM node | Message data object | A new message has been created or appended.
`wl:message:remove` | The message DOM node about to be deleted | None | Just before a message is culled from the page.
