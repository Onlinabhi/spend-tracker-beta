# Data boundary

V21 preserves the existing local storage boundary while introducing a schema version/migration contract. Do not rename or delete the V20 storage key during a UI update. Future migrations should be additive and tested against real V20 backups before changing the stored shape.
