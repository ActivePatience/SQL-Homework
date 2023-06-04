SELECT DISTINCT employee.id, employee.first_name, employee.last_name, employee.manager, GROUP_CONCAT(role.job_title) AS titles, SUM(role.salary) AS total_salary, GROUP_CONCAT(department.department_name) AS departments
FROM employee_role
RIGHT JOIN employee on employee_role.employee_id = employee.id
LEFT JOIN role on employee_role.role_id = role.id
LEFT JOIN department on role.department_name = department.department_name
GROUP BY id;