-- Alters the submissions.type constraint
alter table submissions
  drop constraint if exists submissions_type_check;

alter table submissions
  add constraint submissions_type_check
  check (
    type in ('image','music','video','podcast','blog','article','book','research')
  );
