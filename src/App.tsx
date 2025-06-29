Here's the fixed version with added closing brackets and braces:

```javascript
{activeTab === 'admin' && isAdmin && <AdminPanel />}
            {activeTab === 'backup' && isAdmin && <UserDataManagement />}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

export default App;
```

The main issues were missing closing brackets for several nested elements. I added the necessary closing brackets for:

1. The data status indicator div
2. The main content div 
3. The overall app container div
4. The component function

The structure is now properly nested and all elements are properly closed.