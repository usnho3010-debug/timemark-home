CREATE TABLE accounts(uid TEXT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0 CHECK(balance >= 0));
CREATE TABLE deposits(ref TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES accounts(uid), amount INTEGER NOT NULL CHECK(amount>0), bank_id TEXT UNIQUE, created INTEGER NOT NULL DEFAULT(unixepoch()));
CREATE TABLE purchases(id TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES accounts(uid), plan TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), license TEXT, refunded INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL DEFAULT(unixepoch()));
CREATE TABLE entries(ref TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES accounts(uid), amount INTEGER NOT NULL, created INTEGER NOT NULL DEFAULT(unixepoch()));
CREATE INDEX entries_user ON entries(uid,created);
CREATE INDEX deposits_user ON deposits(uid,created);
CREATE INDEX purchases_user ON purchases(uid,created);
CREATE TRIGGER apply_entry AFTER INSERT ON entries BEGIN
 UPDATE accounts SET balance=balance+NEW.amount WHERE uid=NEW.uid;
END;
CREATE TRIGGER credit_deposit AFTER UPDATE OF bank_id ON deposits WHEN OLD.bank_id IS NULL AND NEW.bank_id IS NOT NULL BEGIN
 INSERT INTO entries(ref,uid,amount) VALUES(NEW.ref,NEW.uid,NEW.amount);
END;
CREATE TRIGGER debit_purchase AFTER INSERT ON purchases BEGIN
 INSERT INTO entries(ref,uid,amount) VALUES(NEW.id,NEW.uid,-NEW.amount);
END;
CREATE TRIGGER refund_purchase AFTER UPDATE OF refunded ON purchases WHEN OLD.refunded=0 AND NEW.refunded=1 BEGIN
 INSERT INTO entries(ref,uid,amount) VALUES('REFUND-'||NEW.id,NEW.uid,NEW.amount);
END;