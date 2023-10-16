### saposocket:

1. **Client**:
   - The `Client` object represents a client-side entity that can connect to the server.
   - Clients can execute functions and communicate with the server.
   - Clients are instances of the `Client` class.
   - They have a `socket` property for communication and a `plugin` property to access client-side functions.

2. **Server**:
   - The `Server` object represents the server-side entity responsible for handling client connections and requests.
   - It manages client connections, user accounts, and functions execution.
   - Server is an instance of the `Server` class.
   - It has properties for managing clients, users, the superuser key, and plugins.

3. **ServerClient**:
   - The `ServerClient` object represents an individual client connected to the server.
   - Each client has its own `ServerClient` object.
   - It has properties like `socket` for communication, `request` for request-related data, `ip` to store the client's IP address, `username` to store the client's username, `_key` for encryption keys, and `_file` for file-related configurations.

### Plugins:

- Plugins are functions or modules that extend the functionality of your server or client.
- You can think of them as sets of functions that provide additional capabilities.
- Plugins are stored as properties of the `Server` or `Client` objects.
- They are categorized into `std` (standard) and `unsafe` plugins.

### Server-Side Plugins (std, unsafe):

1. **std (Server Standard)**:
   - These are standard functions that are typically available for all users.
   - They include functions like `say`, `login`, `register`, and `tell`.
   - These functions are categorized by their purpose and can be executed by authenticated users.

2. **unsafe (Server Unsafe)**:
   - These are server-side functions that can be executed by superusers or privileged users.
   - Functions like `$sh`, `$setsukey`, and `$randomizekey` fall into this category.
   - Superusers have access to these functions for server management.

### How to Access Plugins:

- Plugins can be accessed and executed using the following format: `object.plugin[pluginName](arguments)`.
- For example, to call the `login` function in the `std` plugin, you can use `server.plugin.login(server, serverclient, [username, password])`.

### IP and Username:

- The `ServerClient` object stores the client's IP address in the `ip` property.
- The `username` property in `ServerClient` is used to store the client's username.
- `username` is typically set during the login process.

### File Configuration (_file):

- The `_file` property within the `ServerClient` object is used to store file-related configurations.
- This includes properties like `allowreceive` and `allowsend`, which control file transfer permissions.
- Other properties, such as `prohibitedfileextensions`, control what types of files can be transferred.
- `sharedpath` specifies the directory path for shared files.

Understanding these objects, plugins, and configurations will help you navigate and utilize the functionality of your server and clients effectively.

### Function Naming Conventions:

In your code, you have different function names that follow specific naming conventions. Here are some naming conventions used in your code:

- Functions starting with `$` (e.g., `$sh`):
  - These functions are intended for execution by superusers ('su').
  - Superusers typically have elevated privileges and can perform system-level tasks.
  - These functions are generally not accessible to regular users or clients.
  
- Functions starting with `@` (e.g., `@setpassword`):
  - These functions are intended for execution by logged-in users.
  - These functions may provide user-specific actions like changing passwords or user-related tasks.
  - They are typically accessible to authenticated users but not to superusers.

- Functions starting with `.` (e.g., `.plugin`):
  - Functions starting with a dot are used for self-use.
  - They can be invoked by clients for their own purposes and are typically used for client-specific actions.
  
- Functions with no special prefix:
  - These are standard functions that are part of your application's core functionality.
  - They may include general features that are accessible to all users, such as sending messages.

### 'su' (Superuser):

The term 'su' typically stands for 'superuser' in the context of a computer system. Superusers have the highest level of access and privileges within a system, often equivalent to an administrator or root user. In your code:

- The 'su' mode is enabled by providing a special key (`$su` function).
- Superusers have additional permissions and can perform specific actions, such as changing the server's key (`$setsukey` function).

### 'login':

The 'login' function allows users to authenticate themselves with the server. To use the 'login' function:

- Users provide their username and password.
- The server checks if the provided credentials match a registered user.
- If the credentials are valid, the user is considered logged in, and they gain access to specific user-related functions.

### Interaction Between Functions:

- Superusers (`$su`):
  - Superusers can enable the 'su' mode with the `$su` function, which requires a special key.
  - Once in 'su' mode, superusers can execute other functions with elevated privileges.
  
- Logged-In Users (`login`):
  - Users can log in using the 'login' function by providing their username and password.
  - Once logged in, users have access to functions starting with `@` and regular functions.

- Regular Functions:
  - Regular functions, such as `say`, provide standard communication and system features.
  - These functions are typically accessible to all users, including those in 'su' and 'logged-in' modes.

It's essential to understand these naming conventions and how the different modes and functions in your code are designed to work. Users can invoke these functions based on their role and permissions, with superusers having the highest level of control.

Certainly! It seems there are several `call` functions throughout your code, each serving a specific purpose. Let's break down their usage and location.

### Call Functions:

1. **Client-side Call**:
   - The `call` function in the `Client` object is a method that allows the client to send messages to the server.
   - This function is used to execute various server-side functions by passing the function name and any required arguments.
   - It is located in the `Client` object.

```javascript
// Example usage in the Client object
client.call('functionName', [arg1, arg2]);
```

2. **Server-side Call** (ServerClient's Socket):
   - The `call` function in the `ServerClient` object's `socket` property allows the server to send messages to a specific client.
   - It is used for sending messages or responses to individual clients.
   - This function is accessed through the `ServerClient` object's `socket` property.

```javascript
// Example usage in the ServerClient's socket
serverclient.socket.call('messageType', 'messageData');
```

3. **Server-side Call (Global)**:
   - The server uses the `call` function within a server-side plugin to send messages or responses to all connected clients.
   - It's used when a message or data needs to be broadcast to all clients.
   - This function is called directly within the server-side plugins.

```javascript
// Example usage in a server-side plugin
this.call('messageType', 'messageData');
```

The `call` functions serve as communication bridges between clients and the server, as well as among clients themselves. They facilitate the exchange of messages and data within your server-client architecture.

### Server Functions (std.server)

#### `$run(server, serverclient, data)`

- **Description:** Executes a series of commands provided in `data.code`. It processes the commands and runs the corresponding server or user functions.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object containing the `data.code` property, which is a string of commands.
- **Usage:**
  ```javascript
  $run(server, serverclient, { code: 'command1 param1 param2' });
  ```

#### `$setsukey(server, serverclient, data)`

- **Description:** Sets a new superuser (su) key for the server. This key allows privileged access to certain commands.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with the `key` property, which is the new su key.
- **Usage:**
  ```javascript
  $setsukey(server, serverclient, { key: 'newSuperuserKey' });
  ```

#### `$randomizekey(server, serverclient, data)`

- **Description:** Generates a new random key and updates the su key for the server.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with the `keysize` property, which specifies the size of the new key.
- **Usage:**
  ```javascript
  $randomizekey(server, serverclient, { keysize: 16 });
  ```

#### `@setpassword(server, serverclient, data)`

- **Description:** Allows a user to change their password.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with `oldpassword` and `password` properties.
- **Usage:**
  ```javascript
  @setpassword(server, serverclient, { oldpassword: 'oldPassword', password: 'newPassword' });
  ```

#### `@help(server, serverclient, data)`

- **Description:** Displays a list of available commands and their descriptions.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): Not used.
- **Usage:**
  ```javascript
  @help(server, serverclient, {});
  ```

#### `login(server, serverclient, data)`

- **Description:** Allows a user to log in with a username and password.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with `username` and `password` properties.
- **Usage:**
  ```javascript
  login(server, serverclient, { username: 'user', password: 'pass' });
  ```

#### `register(server, serverclient, data)`

- **Description:** Registers a new user with a username and password.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with `username` and `password` properties.
- **Usage:**
  ```javascript
  register(server, serverclient, { username: 'newUser', password: 'newPass' });
  ```

#### `@su(server, serverclient, data)`

- **Description:** Enables superuser mode if the provided key matches the server's superuser key.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with a `key` property.
- **Usage:**
  ```javascript
  @su(server, serverclient, { key: 'superuserKey' });
  ```

#### `tell(server, serverclient, data)`

- **Description:** Sends a message to a specific user identified by their username.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with `username` and `message` properties.
- **Usage:**
  ```javascript
  tell(server, serverclient, { username: 'recipientUser', message: 'Hello!' });
  ```

#### `yell(server, serverclient, data)`

- **Description:** Broadcasts a message to all connected users.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object with a `message` property.
- **Usage:**
  ```javascript
  yell(server, serverclient, { message: 'Attention, everyone!' });
  ```

#### `$set_file(server, serverclient, data)`

- **Description:** Configures file sharing settings for the server, including allowed receive and send permissions, prohibited file extensions, and a shared file path.
- **Parameters:**
  -

 `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object containing file sharing settings.
- **Usage:**
  ```javascript
  $set_file(server, serverclient, {
    receive: true,
    send: true,
    prohibitedExtensions: ['.exe', '.bat'],
    sharedPath: '/path/to/shared/files',
  });
  ```

#### `@set_client_file(server, serverclient, data)`

- **Description:** Configures file sharing settings for a specific client, such as their permissions and path.
- **Parameters:**
  - `server` (object): The server instance.
  - `serverclient` (object): Information about the connected client.
  - `data` (object): An object containing file sharing settings for the client.
- **Usage:**
  ```javascript
  @set_client_file(server, serverclient, {
    clientID: 'client123',
    receive: true,
    send: false,
    clientPath: '/path/to/client/files',
  });
  ```

### Unsafe Functions (std.unsafe)

The `unsafe` functions should be used with caution, as they perform potentially risky operations.

## License

This code is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).
