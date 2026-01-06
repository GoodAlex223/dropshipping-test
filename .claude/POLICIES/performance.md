# Performance Policy

Standards for writing performant code and identifying optimization opportunities.

---

## Core Principles

1. **Measure before optimizing** - Don't guess where bottlenecks are
2. **Optimize for the common case** - Focus on frequently executed paths
3. **Premature optimization is the root of all evil** - Clarity first, then optimize
4. **Consider the full stack** - Network, database, application, client

---

## Performance Mindset

### When to Optimize

| Situation                   | Action                                      |
| --------------------------- | ------------------------------------------- |
| Writing new code            | Write clear code first, profile if slow     |
| Performance complaint       | Measure, identify bottleneck, then optimize |
| Code review                 | Flag obvious issues, suggest investigation  |
| Known hot path              | Optimize proactively                        |
| Premature optimization urge | Resist until measured                       |

### Optimization Priority

```
1. Algorithm complexity (O(n²) → O(n log n))
2. Database queries (N+1, missing indexes)
3. I/O operations (network, disk)
4. Memory allocation patterns
5. CPU-intensive operations
6. Micro-optimizations (rarely worth it)
```

---

## Complexity Analysis

### Big O Reference

| Complexity | Name         | Example         | Scalability        |
| ---------- | ------------ | --------------- | ------------------ |
| O(1)       | Constant     | Hash lookup     | ✅ Excellent       |
| O(log n)   | Logarithmic  | Binary search   | ✅ Excellent       |
| O(n)       | Linear       | Array iteration | ✅ Good            |
| O(n log n) | Linearithmic | Efficient sort  | ✅ Good            |
| O(n²)      | Quadratic    | Nested loops    | ⚠️ Watch carefully |
| O(2ⁿ)      | Exponential  | Naive recursion | ❌ Avoid           |
| O(n!)      | Factorial    | Permutations    | ❌ Avoid           |

### Complexity Red Flags

```python
# ❌ O(n²) - Nested loops on same data
for item in items:
    if item in other_items:  # O(n) lookup in list
        process(item)

# ✅ O(n) - Use set for O(1) lookup
other_set = set(other_items)
for item in items:
    if item in other_set:  # O(1) lookup
        process(item)
```

```python
# ❌ O(n²) - Repeated string concatenation
result = ""
for item in items:
    result += str(item)  # Creates new string each time

# ✅ O(n) - Join at the end
result = "".join(str(item) for item in items)
```

---

## Database Performance

### N+1 Query Problem

```python
# ❌ N+1 queries - 1 for users + N for posts
users = User.objects.all()
for user in users:
    posts = user.posts.all()  # Query per user!

# ✅ Eager loading - 2 queries total
users = User.objects.prefetch_related('posts').all()
for user in users:
    posts = user.posts.all()  # No additional query
```

### Query Optimization Checklist

- [ ] **Indexing**: Do filtered/sorted columns have indexes?
- [ ] **Select only needed columns**: Avoid `SELECT *`
- [ ] **Pagination**: Use LIMIT for large result sets
- [ ] **Eager loading**: Prefetch related data
- [ ] **Query count**: Monitor number of queries per request
- [ ] **Explain plan**: Check query execution plan

### Index Guidelines

```sql
-- Create indexes for:
-- 1. WHERE clause columns
CREATE INDEX idx_users_email ON users(email);

-- 2. JOIN columns
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 3. ORDER BY columns
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- 4. Composite indexes for common queries
CREATE INDEX idx_posts_user_date ON posts(user_id, created_at);
```

### Query Performance Targets

| Query Type     | Target            | Warning |
| -------------- | ----------------- | ------- |
| Simple lookup  | < 10ms            | > 50ms  |
| List query     | < 50ms            | > 200ms |
| Complex report | < 500ms           | > 2s    |
| Background job | Context-dependent | Monitor |

---

## Caching

### Cache Hierarchy

```
L1: In-memory (process) - microseconds
L2: Distributed cache (Redis) - milliseconds
L3: Database - tens of milliseconds
L4: External API - hundreds of milliseconds
```

### When to Cache

| Cache When                 | Don't Cache When        |
| -------------------------- | ----------------------- |
| Data rarely changes        | Data changes frequently |
| Expensive to compute/fetch | Cheap to compute/fetch  |
| Accessed frequently        | Accessed rarely         |
| Staleness is acceptable    | Must be real-time       |

### Cache Invalidation Strategies

```python
# Time-based expiration
cache.set("key", value, ttl=300)  # 5 minutes

# Event-based invalidation
def update_user(user_id, data):
    user = User.update(user_id, data)
    cache.delete(f"user:{user_id}")
    return user

# Versioned keys
def get_user(user_id, version):
    return cache.get(f"user:{user_id}:v{version}")
```

### Cache Patterns

```python
# Cache-aside (lazy loading)
def get_user(user_id):
    cached = cache.get(f"user:{user_id}")
    if cached:
        return cached

    user = db.query(User).get(user_id)
    cache.set(f"user:{user_id}", user, ttl=300)
    return user

# Write-through
def update_user(user_id, data):
    user = db.query(User).get(user_id)
    user.update(data)
    db.commit()
    cache.set(f"user:{user_id}", user)
    return user
```

---

## Memory Management

### Memory Efficiency

```python
# ❌ Loading everything into memory
data = list(huge_file.readlines())  # All in memory
for line in data:
    process(line)

# ✅ Streaming/iteration
for line in huge_file:  # One line at a time
    process(line)
```

```python
# ❌ Creating unnecessary copies
def process(items):
    items = items[:]  # Unnecessary copy
    return [x * 2 for x in items]

# ✅ Work with original when possible
def process(items):
    return [x * 2 for x in items]  # Generator is even better
```

### Generator Patterns

```python
# ❌ List comprehension (all in memory)
squares = [x**2 for x in range(1000000)]

# ✅ Generator expression (lazy evaluation)
squares = (x**2 for x in range(1000000))

# ✅ Generator function
def generate_squares(n):
    for x in range(n):
        yield x**2
```

### Memory Leak Prevention

- Close file handles and connections
- Remove event listeners when done
- Clear references to large objects
- Use weak references where appropriate
- Profile memory usage in long-running processes

---

## I/O Performance

### Async I/O for Multiple Operations

```python
# ❌ Sequential I/O
for url in urls:
    response = requests.get(url)  # Blocking
    results.append(response)

# ✅ Concurrent I/O
async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)
```

### Batch Operations

```python
# ❌ Individual inserts
for user in users:
    db.execute("INSERT INTO users VALUES (?)", user)

# ✅ Batch insert
db.executemany("INSERT INTO users VALUES (?)", users)
# Or bulk_create in ORMs
User.objects.bulk_create(users)
```

### Connection Pooling

```python
# ❌ New connection per request
def query():
    conn = create_connection()
    result = conn.execute(query)
    conn.close()
    return result

# ✅ Connection pool
pool = create_pool(min_size=5, max_size=20)

def query():
    with pool.connection() as conn:
        return conn.execute(query)
```

---

## Response Time Budgets

### Web Request Budget Example

```
Total budget: 200ms

├─ Network latency: 50ms (fixed)
├─ Server processing: 100ms
│  ├─ Authentication: 10ms
│  ├─ Database queries: 50ms
│  ├─ Business logic: 30ms
│  └─ Serialization: 10ms
├─ Network latency: 50ms (fixed)
```

### Setting Budgets

| Operation         | Fast    | Acceptable | Slow   |
| ----------------- | ------- | ---------- | ------ |
| API response      | < 100ms | < 500ms    | > 1s   |
| Page load         | < 1s    | < 3s       | > 5s   |
| Search            | < 200ms | < 1s       | > 2s   |
| Report generation | < 5s    | < 30s      | > 1min |

---

## Profiling & Measurement

### What to Measure

- Response time (p50, p95, p99)
- Throughput (requests per second)
- Error rate
- Resource usage (CPU, memory, I/O)
- Query count and time

### Profiling Tools

| Language | Tools                             |
| -------- | --------------------------------- |
| Python   | cProfile, py-spy, memory_profiler |
| Node.js  | clinic, node --inspect, 0x        |
| General  | APM tools (DataDog, New Relic)    |

### Profiling Example

```python
# Python profiling
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Code to profile
result = expensive_operation()

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 functions
```

### Benchmarking

```python
import timeit

# Simple timing
result = timeit.timeit(
    'expensive_function()',
    globals=globals(),
    number=1000
)
print(f"Average: {result/1000:.4f}s")
```

---

## Performance Checklist

### Code Review

- [ ] No obvious O(n²) or worse algorithms?
- [ ] Database queries optimized (no N+1)?
- [ ] Appropriate caching considered?
- [ ] Resources properly closed?
- [ ] No unnecessary data loading?

### Before Deployment

- [ ] Load testing performed?
- [ ] Response times acceptable?
- [ ] Memory usage stable?
- [ ] No query count regression?

### Monitoring

- [ ] Response time alerts configured?
- [ ] Resource usage tracked?
- [ ] Error rate monitored?
- [ ] Slow query logging enabled?

---

## Performance Documentation

### Document Performance Decisions

```python
# Performance note: Using dictionary for O(1) lookup instead of list
# Benchmark showed 100x improvement for datasets > 1000 items
# See: docs/plans/2025-01-15_optimize-search.md
user_index = {user.id: user for user in users}
```

### Track Performance Baselines

```markdown
## Performance Baselines

| Endpoint     | p50  | p95   | p99   | Date       |
| ------------ | ---- | ----- | ----- | ---------- |
| GET /users   | 45ms | 120ms | 250ms | 2025-01-15 |
| POST /orders | 80ms | 200ms | 450ms | 2025-01-15 |
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                  | Problem                      | Solution              |
| ----------------------------- | ---------------------------- | --------------------- |
| Premature optimization        | Wastes time, adds complexity | Measure first         |
| N+1 queries                   | Exponential DB calls         | Eager loading         |
| Loading all data              | Memory exhaustion            | Pagination, streaming |
| Synchronous I/O in hot paths  | Blocking                     | Async I/O             |
| Missing indexes               | Slow queries                 | Analyze and index     |
| No caching                    | Repeated computation         | Strategic caching     |
| String concatenation in loops | O(n²)                        | StringBuilder/join    |
| Nested loops on large data    | O(n²)                        | Hash-based lookup     |

---

_See [testing.md](testing.md) for performance testing._
_See [documentation.md](documentation.md) for documenting performance decisions._
