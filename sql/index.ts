import { sql } from "./sql";

const select = sql(`
  SELECT DISTINCT
    p.name,
    p.age AS nenrei,
    (SELECT 1 AS dummy FROM DUAL) count
  FROM
    person as p
  WHERE
    country_id = (SELECT country_id FROM country WHERE name = :country_name)
    AND age > :age
` as const);





const results = select.find({ country_name: 'japan', age: 30 });

results[0].name;
results[0].nenrei;
results[0].count;

// build error ts(2339)
// results[0].age;
// results[0].dummy;
