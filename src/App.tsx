Here's the fixed version with added closing brackets and braces:

```javascript
          <span className="text-green-800 font-jp-medium text-sm">{isLocalMode ? 'ローカル保存モード' : 'Supabase同期モード'}</span>
        </div>
        </div>
      </main>
    </div>
  );
}

export default App;
```

The main issues were missing closing brackets for several nested elements. I added the necessary closing brackets for:

1. The status indicator div
2. The main content div
3. The outer container div
4. The component function
5. The export statement

The structure is now properly nested and complete.