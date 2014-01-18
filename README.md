Wigslace (v2)
=============

Wigslace live chat system. Utilises a Node.js server runningsocket.io, express,
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
5. Message creation events (see subheading)

**On message recieved:**

1. `wl:socket:message:recieve`
2. Message creation events (see subheading)

**On message creation:**

1. `wl:message:create` **OR** `wl:message:append`
2. `wl:message:new`

### Socket events

Event Name | Triggered On | Argument | Description
--- | ---  | --- | ---
`wl:socket:ready` | `document` | None | Called when the socket.io connection is established.
`wl:socket:message:send` | `document` | The message text being sent | Called when the client is just about to send a message to the server.
`wl:socket:message:recieve` | `document` | The message data object | Called when the client recieves a message from the server.
`wl:socket:scrollback` | `document` | Array of message data objects | Called when the server sends a scrollback event.
`wl:socket:userData` | `document` | User data recieved | Called when the server responds to a request for data on a user.
`wl:socket:join` | `document` | User ID | Called when a user has joined the chat.
`wl:socket:part` | `document` | User ID | Called when a user has left the chat.

### Message Events

Event Name | Triggered On | Argument | Description
--- | ---  | --- | ---
`wl:message:create` | The message DOM node | Message data object | Called when a new message DOM node is created
`wl:message:append` | The message DOM node | Message data object | Called when a new DOM node is not required, and the client appends the message to an existing one.
`wl:message:new` | The message DOM node | Message data object | Called when a new message has been created or appended.
`wl:message:remove` | The message DOM node about to be deleted | None | Called just before a message is culled from the page.
