// In-memory storage for local testing (replaces Firebase)
class MemoryStore {
  constructor() {
    this.collections = {
      rooms: new Map(),
      tickets: new Map(),
      claims: new Map(),
    };
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new Map();
    }

    return {
      doc: (id) => ({
        get: async () => {
          const data = this.collections[name].get(id);
          return {
            exists: !!data,
            data: () => data,
          };
        },
        set: async (data) => {
          this.collections[name].set(id, data);
        },
        update: async (updates) => {
          const existing = this.collections[name].get(id) || {};
          this.collections[name].set(id, { ...existing, ...updates });
        },
      }),
      where: (field, op, value) => ({
        where: (field2, op2, value2) => ({
          where: (field3, op3, value3) => ({
            limit: (n) => ({
              get: async () => {
                const results = Array.from(this.collections[name].values())
                  .filter((doc) => {
                    let match = true;
                    if (field && op && value !== undefined) {
                      match = match && this.checkCondition(doc[field], op, value);
                    }
                    if (field2 && op2 && value2 !== undefined) {
                      match = match && this.checkCondition(doc[field2], op2, value2);
                    }
                    if (field3 && op3 && value3 !== undefined) {
                      match = match && this.checkCondition(doc[field3], op3, value3);
                    }
                    return match;
                  })
                  .slice(0, n);
                return {
                  empty: results.length === 0,
                  docs: results.map((data) => ({ data: () => data })),
                };
              },
            }),
            orderBy: (field, direction) => ({
              get: async () => {
                const results = Array.from(this.collections[name].values())
                  .filter((doc) => {
                    let match = true;
                    if (field && op && value !== undefined) {
                      match = match && this.checkCondition(doc[field], op, value);
                    }
                    if (field2 && op2 && value2 !== undefined) {
                      match = match && this.checkCondition(doc[field2], op2, value2);
                    }
                    if (field3 && op3 && value3 !== undefined) {
                      match = match && this.checkCondition(doc[field3], op3, value3);
                    }
                    return match;
                  })
                  .sort((a, b) => {
                    if (direction === 'asc') {
                      return a[field] > b[field] ? 1 : -1;
                    }
                    return a[field] < b[field] ? 1 : -1;
                  });
                return {
                  empty: results.length === 0,
                  docs: results.map((data) => ({ data: () => data, ref: { update: async (updates) => {} } })),
                };
              },
            }),
            get: async () => {
              const results = Array.from(this.collections[name].values()).filter((doc) => {
                let match = true;
                if (field && op && value !== undefined) {
                  match = match && this.checkCondition(doc[field], op, value);
                }
                if (field2 && op2 && value2 !== undefined) {
                  match = match && this.checkCondition(doc[field2], op2, value2);
                }
                if (field3 && op3 && value3 !== undefined) {
                  match = match && this.checkCondition(doc[field3], op3, value3);
                }
                return match;
              });
              return {
                empty: results.length === 0,
                docs: results.map((data) => ({ data: () => data, ref: { update: async (updates) => {} } })),
              };
            },
          }),
          orderBy: (field, direction) => ({
            get: async () => {
              const results = Array.from(this.collections[name].values())
                .filter((doc) => {
                  let match = true;
                  if (field && op && value !== undefined) {
                    match = match && this.checkCondition(doc[field], op, value);
                  }
                  if (field2 && op2 && value2 !== undefined) {
                    match = match && this.checkCondition(doc[field2], op2, value2);
                  }
                  return match;
                })
                .sort((a, b) => {
                  if (direction === 'asc') {
                    return a[field] > b[field] ? 1 : -1;
                  }
                  return a[field] < b[field] ? 1 : -1;
                });
              return {
                empty: results.length === 0,
                docs: results.map((data) => ({ data: () => data, ref: { update: async (updates) => {} } })),
              };
            },
          }),
          limit: (n) => ({
            get: async () => {
              const results = Array.from(this.collections[name].values())
                .filter((doc) => {
                  let match = true;
                  if (field && op && value !== undefined) {
                    match = match && this.checkCondition(doc[field], op, value);
                  }
                  if (field2 && op2 && value2 !== undefined) {
                    match = match && this.checkCondition(doc[field2], op2, value2);
                  }
                  return match;
                })
                .slice(0, n);
              return {
                empty: results.length === 0,
                docs: results.map((data) => ({ data: () => data })),
              };
            },
          }),
          get: async () => {
            const results = Array.from(this.collections[name].values()).filter((doc) => {
              let match = true;
              if (field && op && value !== undefined) {
                match = match && this.checkCondition(doc[field], op, value);
              }
              if (field2 && op2 && value2 !== undefined) {
                match = match && this.checkCondition(doc[field2], op2, value2);
              }
              return match;
            });
            return {
              empty: results.length === 0,
              docs: results.map((data) => ({ data: () => data, ref: { update: async (updates) => {} } })),
            };
          },
        }),
        limit: (n) => ({
          get: async () => {
            const results = Array.from(this.collections[name].values())
              .filter((doc) => this.checkCondition(doc[field], op, value))
              .slice(0, n);
            return {
              empty: results.length === 0,
              docs: results.map((data) => ({ data: () => data })),
            };
          },
        }),
        orderBy: (orderField, direction) => ({
          get: async () => {
            const results = Array.from(this.collections[name].values())
              .filter((doc) => this.checkCondition(doc[field], op, value))
              .sort((a, b) => {
                if (direction === 'asc') {
                  return a[orderField] > b[orderField] ? 1 : -1;
                }
                return a[orderField] < b[orderField] ? 1 : -1;
              });
            return {
              empty: results.length === 0,
              docs: results.map((data) => ({ data: () => data, ref: { update: async (updates) => {} } })),
            };
          },
        }),
        get: async () => {
          const results = Array.from(this.collections[name].values()).filter((doc) =>
            this.checkCondition(doc[field], op, value)
          );
          return {
            empty: results.length === 0,
            docs: results.map((data) => ({ data: () => data, ref: { update: async (updates) => {} } })),
          };
        },
      }),
    };
  }

  checkCondition(docValue, op, value) {
    switch (op) {
      case '==':
        return docValue === value;
      case 'in':
        return value.includes(docValue);
      default:
        return true;
    }
  }
}

const db = new MemoryStore();

export { db };
