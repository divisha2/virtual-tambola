// Firebase Realtime Database adapter to work like Firestore
class RealtimeDBAdapter {
  constructor(database) {
    this.db = database;
  }

  collection(name) {
    return {
      doc: (id) => ({
        get: async () => {
          const snapshot = await this.db.ref(`${name}/${id}`).once('value');
          const data = snapshot.val();
          return {
            exists: data !== null,
            data: () => data,
          };
        },
        set: async (data) => {
          await this.db.ref(`${name}/${id}`).set(data);
        },
        update: async (updates) => {
          await this.db.ref(`${name}/${id}`).update(updates);
        },
      }),
      where: (field, op, value) => ({
        where: (field2, op2, value2) => ({
          where: (field3, op3, value3) => ({
            limit: (n) => ({
              get: async () => {
                const snapshot = await this.db.ref(name).once('value');
                const allData = snapshot.val() || {};
                const results = Object.values(allData).filter((doc) => {
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
                }).slice(0, n);
                return {
                  empty: results.length === 0,
                  docs: results.map((data) => ({ data: () => data })),
                };
              },
            }),
            orderBy: (orderField, direction) => ({
              get: async () => {
                const snapshot = await this.db.ref(name).once('value');
                const allData = snapshot.val() || {};
                const results = Object.values(allData)
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
                      return a[orderField] > b[orderField] ? 1 : -1;
                    }
                    return a[orderField] < b[orderField] ? 1 : -1;
                  });
                return {
                  empty: results.length === 0,
                  docs: results.map((data) => ({
                    data: () => data,
                    ref: {
                      update: async (updates) => {
                        const id = data[Object.keys(data).find(k => k.includes('Id'))];
                        if (id) {
                          await this.db.ref(`${name}/${id}`).update(updates);
                        }
                      },
                    },
                  })),
                };
              },
            }),
            get: async () => {
              const snapshot = await this.db.ref(name).once('value');
              const allData = snapshot.val() || {};
              const results = Object.values(allData).filter((doc) => {
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
                docs: results.map((data) => ({
                  data: () => data,
                  ref: {
                    update: async (updates) => {
                      const id = data[Object.keys(data).find(k => k.includes('Id'))];
                      if (id) {
                        await this.db.ref(`${name}/${id}`).update(updates);
                      }
                    },
                  },
                })),
              };
            },
          }),
          orderBy: (orderField, direction) => ({
            get: async () => {
              const snapshot = await this.db.ref(name).once('value');
              const allData = snapshot.val() || {};
              const results = Object.values(allData)
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
                    return a[orderField] > b[orderField] ? 1 : -1;
                  }
                  return a[orderField] < b[orderField] ? 1 : -1;
                });
              return {
                empty: results.length === 0,
                docs: results.map((data) => ({
                  data: () => data,
                  ref: {
                    update: async (updates) => {
                      const id = data[Object.keys(data).find(k => k.includes('Id'))];
                      if (id) {
                        await this.db.ref(`${name}/${id}`).update(updates);
                      }
                    },
                  },
                })),
              };
            },
          }),
          limit: (n) => ({
            get: async () => {
              const snapshot = await this.db.ref(name).once('value');
              const allData = snapshot.val() || {};
              const results = Object.values(allData)
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
            const snapshot = await this.db.ref(name).once('value');
            const allData = snapshot.val() || {};
            const results = Object.values(allData).filter((doc) => {
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
              docs: results.map((data) => ({
                data: () => data,
                ref: {
                  update: async (updates) => {
                    const id = data[Object.keys(data).find(k => k.includes('Id'))];
                    if (id) {
                      await this.db.ref(`${name}/${id}`).update(updates);
                    }
                  },
                },
              })),
            };
          },
        }),
        limit: (n) => ({
          get: async () => {
            const snapshot = await this.db.ref(name).once('value');
            const allData = snapshot.val() || {};
            const results = Object.values(allData)
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
            const snapshot = await this.db.ref(name).once('value');
            const allData = snapshot.val() || {};
            const results = Object.values(allData)
              .filter((doc) => this.checkCondition(doc[field], op, value))
              .sort((a, b) => {
                if (direction === 'asc') {
                  return a[orderField] > b[orderField] ? 1 : -1;
                }
                return a[orderField] < b[orderField] ? 1 : -1;
              });
            return {
              empty: results.length === 0,
              docs: results.map((data) => ({
                data: () => data,
                ref: {
                  update: async (updates) => {
                    const id = data[Object.keys(data).find(k => k.includes('Id'))];
                    if (id) {
                      await this.db.ref(`${name}/${id}`).update(updates);
                    }
                  },
                },
              })),
            };
          },
        }),
        get: async () => {
          const snapshot = await this.db.ref(name).once('value');
          const allData = snapshot.val() || {};
          const results = Object.values(allData).filter((doc) =>
            this.checkCondition(doc[field], op, value)
          );
          return {
            empty: results.length === 0,
            docs: results.map((data) => ({
              data: () => data,
              ref: {
                update: async (updates) => {
                  const id = data[Object.keys(data).find(k => k.includes('Id'))];
                  if (id) {
                    await this.db.ref(`${name}/${id}`).update(updates);
                  }
                },
              },
            })),
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

export { RealtimeDBAdapter };
