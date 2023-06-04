INSERT INTO employee (first_name, last_name, manager)
VALUES
    ('Jack', 'Black', 'Jim Morrison'),
    ('Ted', 'Red', NULL),
    ('Lou', 'Blue', NULL);
    
INSERT INTO department (department_name)
VALUES
    ('War'),
    ('Peace'),
    ('Satire');

INSERT INTO role (job_title, salary, department_name)
VALUES
    ('Ditch digger', 5, 'War'),
    ('Artillerist', 10, NULL),
    ('Writer', 20, 'Satire'),
    ('Gardener', 7, 'Peace');

INSERT INTO employee_role (employee_id, role_id)
VALUES
    (1, 3),
    (1, 4),
    (2, 2),
    (3, 1);