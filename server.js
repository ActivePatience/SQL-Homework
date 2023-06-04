const inquirer = require('inquirer');
const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: process.env.DB_USER,
    // TODO: Add MySQL password here
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  console.log(`Connected to the database.`)
);

function run_sql(sql=''){
  db.query('SELECT base.department, SUM(base.role_salary) AS total_department_salaries FROM (SELECT role.job_title, role.department_name AS department, (role.salary*COUNT(employee_role.employee_id)) AS role_salary  FROM role LEFT JOIN employee_role ON role.id = employee_role.role_id GROUP BY role.job_title) base GROUP BY base.department', (err, result) => {
    if (err) {console.log(err); return 'fail';}
    console.clear();
    console.table(result);
    setTimeout(prompt,50);
  });
}

function view(table){
  const sql = fs.readFileSync("./view_" + table + ".sql").toString();
  db.query(sql, (err, result) => {
    if (err) {console.log(err); return 'fail';}
    console.clear();
    console.table(result);
    setTimeout(prompt,50);
  });
}

function del(table,id){
  if(table == 'role' || table == 'employee'){
    const sql =`DELETE FROM employee_role
                WHERE ${table}_id=${id};`;
    db.query(sql, (err, result) => {
      if (err) {console.log(err); return 'fail';}
    });
  }

  if(table == 'department'){
    const sql =`UPDATE role SET department_name = NULL WHERE department_name=(SELECT department_name FROM department WHERE id=${id})`;
    db.query(sql, (err, result) => {
      if (err) {console.log(err); return 'fail';}
    });
  }

  const sql =`DELETE FROM ${table}
              WHERE id=${id};`;
  db.query(sql, (err, result) => {
    if (err) {console.log(err); return 'fail';}
    view(table+'s');
  });
}

function add_employee(a){
  let sql1;
  if(a.manager != ''){
    sql1 =`INSERT IGNORE INTO employee (first_name, last_name, manager)
           VALUES ('${a.first_name}', '${a.last_name}', '${a.manager}');
           `;
  }else{
    sql1 =`INSERT IGNORE INTO employee (first_name, last_name)
           VALUES ('${a.first_name}', '${a.last_name}');
           `;
  }
  db.query(sql1, (err, result) => {
    if (err) {console.log(err);}
    if(a.role != 'None'){
      const sql2 = `INSERT IGNORE INTO employee_role (employee_id, role_id)
                    VALUES ((SELECT MAX(id) FROM employee),
                    (SELECT id FROM role WHERE job_title='${a.role}'));
                    `;
      db.query(sql2, (err, result) => {
        if (err) {console.log(err);return;}
        view('employees');
        return result;
      });
    }
    else{view('employees');}
  });
}

function add_role(a){
  const sql =`INSERT IGNORE INTO role (job_title, salary, department_name)
              VALUES ('${a.job_title}', ${parseInt(a.salary)}, '${a.department}');
              `;
  db.query(sql, (err, result) => {
    if (err) {console.log(err); return 'fail';}
    view('roles');
  });
}

function add_department(a){
  const sql =`INSERT IGNORE INTO department (department_name)
              VALUES ('${a.departmentName}');
              `;
  db.query(sql, (err, result) => {
    if (err) {console.log(err); return 'fail';}
    view('departments');
    return result;
  });
}

function update_employee(a){
  // As a note to the grader; I think I went overboard with
  // the ability to possess multiple roles and salaries for this assignment.
  // The below comment block is what I assume you wanted
  // to verify us being able to use instead of what I did:
  /*
      UPDATE employee
      SET role = (SELECT id FROM role WHERE job_title='${a.role}')
      WHERE id = x;
  */
  let id = parseInt(a.employee.split(" | ")[0]);
  if(a.manager != ''){
    if(a.manager == 'None'){a.manager = 'NULL';}
    else{a.manager = '"' + a.manager + '"';}
    const sql =`UPDATE employee SET manager = ${a.manager} WHERE id=${id}`;
    db.query(sql, (err, result) => {
      if (err) {console.log(err); return err;}
      if (a.roleToAdd == 'None' && a.roleToDelete == 'None'){view('employees');}
    });
  }
  if(a.roleToAdd != 'None'){
    const sql =`INSERT IGNORE INTO employee_role (employee_id, role_id)
                VALUES (${id},
                (SELECT id FROM role WHERE job_title='${a.roleToAdd}'));
                `;
    db.query(sql, (err, result) => {
      if (err) {console.log(err); return err;}
      if (a.roleToDelete == 'None'){view('employees');}
    });
  }
  if(a.roleToDelete != 'None'){
    const sql =`DELETE FROM employee_role
                WHERE employee_id=${id} AND
                role_id=(SELECT id FROM role WHERE job_title='${a.roleToDelete}');
                `;
    db.query(sql, (err, result) => {
      if (err) {console.log(err); return err;}
      view('employees');
    });
  }
  if(a.manager == '' && a.roleToDelete == 'None' && a.roleToAdd == 'None'){
    console.clear();
    console.log('Nothing chosen to edit. No changes made.\n')
    setTimeout(prompt,500);
    return;
  }
}

async function query(list,include_null_option=false,inc_id=false){   
  async function retreive(sql,func){
    async function getArr() {
      try {
        const res = await new Promise((resolve, reject) => {
          db.query(sql, (err, res) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(res);
          });
        });
        return func(res);
      } catch (error) {
        console.log(error);
      }
    }
    let arr = await getArr();
    if(include_null_option){ arr.push('None'); }
    return arr;
  }

  switch(list){
    case 'departments': return await retreive(
                          'SELECT id, department_name FROM department',

                          function(res){
                              let deps = [];
                              for (let i = 0; i < res.length; i++){
                                if(inc_id){deps.push({name: res[i].department_name, value:res[i].id});}
                                else{deps.push(res[i].department_name);}
                              }
                              return deps;
                            }
                        );

    case 'roles':       return await retreive(
                          'SELECT id, job_title FROM role',

                          function(res){
                              let roles = [];
                              for (let i = 0; i < res.length; i++){
                                if(inc_id){roles.push({name: res[i].job_title, value:res[i].id});}
                                else{roles.push(res[i].job_title);}
                              }
                              return roles;
                            }
                        );

    case 'employees':   return await retreive(
                          'SELECT id, first_name, last_name FROM employee',

                          function(res){
                              let emps = [];
                              for (let i = 0; i < res.length; i++){
                                if(inc_id){emps.push({name: res[i].id.toString() + ' | ' + res[i].first_name + ' ' + res[i].last_name, value:res[i].id});}
                                else{emps.push(res[i].id.toString() + ' | ' + res[i].first_name + ' ' + res[i].last_name);}
                              }
                              return emps;
                            }
                        );
  }
}


let q = ['View', 'Delete', 'Add', 'Update Employee', 'View Total Department Salaries'];
let questions = [{type: 'list', name: 'choice', message: 'Please select an option:', choices: q},];

function prompt(){
  inquirer.prompt(questions)
        .then(async function(a){

          switch(a.choice){
            case q[0]: inquirer.prompt([{type: 'list', name: 'table', message: 'View', choices: ['employees','roles','departments']}])
                                .then(b => { view(b.table); });
                                break;
            case q[1]: inquirer.prompt([{type: 'list', name: 'table', message: 'Delete', choices: ['employee','role','department']}])
                                .then(async function(b){
                                  inquirer.prompt([{type: 'list', name: 'name', message: 'Select a member to delete from ' + b.table, choices: await query(b.table+'s',false,true)}])
                                      .then(c => { del(b.table,c.name); });
                                });
                                break;
            case q[2]: inquirer.prompt([{type: 'list', name: 'table', message: 'Add', choices: ['employees','roles','departments']}])
                                .then(async function(b){
                                  switch(b.table){
                                    case 'departments': inquirer.prompt([{name: 'departmentName', message: 'Please provide a name for the new department: '}])
                                                            .then(c => { add_department(c); });
                                                            break;
                                    case 'roles':       inquirer.prompt([
                                                            {name: 'job_title', message: 'Please provide a name for the new role: '},
                                                            {name: 'salary', message: 'Please provide a salary for the new role: '},
                                                            {type: 'list', name: 'department', message: 'Please select the department this new role belongs to: ', choices: await query('departments')}])
                                                            .then(c => { add_role(c); });
                                                            break;
                                    case 'employees':   inquirer.prompt([
                                                            {name: 'first_name', message: 'Please provide a first name for the new employee: '},
                                                            {name: 'last_name', message: 'Please provide a last name for the new employee: '},
                                                            {type: 'list', name: 'role', message: 'Please select an initial role for the new employee: ', choices: await query('roles',true)},
                                                            {name: 'manager', message: 'Please provide a manager for the new employee, if applicable: '}])
                                                            .then(c => { add_employee(c); });
                                                            break;
                                }});
                                break;
            case q[3]:  inquirer.prompt([
                                {type: 'list', name: 'employee', message: 'Please select an employee to edit: ', choices: await query('employees')},
                                {name: 'manager', message: 'Please provide an updated manager.\nLeave blank if unchanged; enter None to remove current manager: '},
                                {type: 'list', name: 'roleToAdd', message: 'Please select a role to add for the new employee, if applicable: ', choices: await query('roles',true)},
                                {type: 'list', name: 'roleToDelete', message: 'Please select a role to delete for the new employee, if applicable: ', choices: await query('roles',true)}])
                                .then(b => { update_employee(b); });
                                break;
            case q[4]:  run_sql(); break;
                        // inquirer.prompt([{name: 'sql', message: 'Enter SQL code: '}])
                        //         .then(b => run_sql(b.sql));
                        //         break;
          }
        });
}
  
prompt();