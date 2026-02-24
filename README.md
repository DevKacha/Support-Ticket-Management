for add user 
goto api/users

data add like : {
    name : "",
    email : "",
    password : "",
    role_id : 1 for manager, 2 for SUPPORT , 3 for USER
}

for get users 
goto api/users

for auth login 
goto api/users/auth/login

add data like : {
    email: "",
    password : ""
}

for tickets
get api/tickets
post api/tickets

add data like : {
    title: "",
    description: "",
    status: "" DEFAULT 'OPEN',
    priority: "" DEFAULT 'MEDIUM',
    created_by : "" (int)
}